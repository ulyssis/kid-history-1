/**
 * Fetch public-domain / freely licensed images for newly added events.
 * Strategy:
 *  1. Try curated Commons filename (if any)
 *  2. Search Wikimedia Commons API by English event name
 *  3. Fall back to generated educational JPEG
 *
 * Run: node scripts/fetch-event-images.mjs
 * Optional: node scripts/fetch-event-images.mjs --only=id1,id2
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const eventsPath = join(root, 'public/data/events.json')
const outDir = join(root, 'public/images/events')
mkdirSync(outDir, { recursive: true })

const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const only = onlyArg
  ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean))
  : null

/** Prefer these Commons files when known-good. */
const CURATED = {
  'battle-kadesh':
    'Battle_scene_from_the_Great_Kadesh_reliefs_of_Ramses_II_on_the_Walls_of_the_Ramesseum.jpg',
  'battle-muye': 'Shi_Qiang_pan.jpg',
  'western-zhou-start': 'Western_Zhou_bronze_vessel.jpg',
  'beacon-fire-lords': 'Western_Zhou.jpg',
  'partition-of-jin': 'Warring_States.png',
  'battle-changping': 'Changping_battlefield.jpg',
  'xu-fu-voyage': 'Xu_Fu.jpg',
  'mount-tai-fengshan': 'Mount_Tai_South_Heavenly_Gate.jpg',
  'baideng-siege': 'Emperor_Gao_of_Han.jpg',
  'western-jin-unify': 'Jin_Wudi.jpg',
  'war-eight-princes': 'Western_Jin_Dynasty.png',
  'battle-fei-river': 'Battle_of_Feishui.jpg',
  'northern-southern-dynasties': 'Northern_and_Southern_dynasties.png',
  'xuanwu-gate': 'Emperor_Taizong_of_Tang.jpg',
  'taizong-eastern-turks': 'Emperor_Taizong_of_Tang.jpg',
  'wencheng-tibet': 'Princess_Wencheng_statue.jpg',
  'wu-zetian-throne': 'Wu_Zetian.jpg',
  'zhu-wen-ends-tang': 'Five_Dynasties_Ten_Kingdoms.png',
  'song-unify': 'Emperor_Taizu_of_Song.jpg',
  'jin-destroy-liao': 'Jin_Dynasty_(1115–1234).png',
  'jingkang-incident': 'Jingkang_Incident.jpg',
  'diaoyu-fortress': 'Diaoyu_Fortress.jpg',
  'battle-of-yamen': 'Battle_of_Yamen.jpg',
  'yuan-invade-japan': 'Takezaki_Suenei_emakimono.jpg',
  'jingnan-campaign': 'Yongle_Emperor.jpg',
  'imjin-war': 'Japanese_invasion_of_Korea_1592.jpg',
  'treaty-nerchinsk': 'Treaty_of_Nerchinsk_border.jpg',
  'qing-dzungar': 'The_Qianlong_Emperor_in_Ceremonial_Armour_on_Horseback.jpg',
  'second-opium-war': 'Yuanmingyuan_ruins.jpg',
  'battle-mawei': 'Battle_of_Foochow.jpg',
  'xinhai-revolution': 'Wuchang_Uprising_Memorial.jpg',
  'yuan-shikai-empire': 'Yuan_Shikai.jpg',
  'northern-expedition': 'Northern_Expedition_map.jpg',
  'sino-soviet-1929': 'Chinese_Eastern_Railway.jpg',
  'mukden-incident': 'Mukden_Incident_explosion.jpg',
  'long-march': 'Long_March_route.png',
  'nanjing-massacre': 'Nanjing_Massacre_Museum.jpg',
  'battle-taierzhuang': 'Battle_of_Taierzhuang_memorial.jpg',
  'bombing-chongqing': 'Chongqing_bombing_1939.jpg',
  'pearl-harbor': 'USSArizona-burning.jpg',
  'japan-surrender': 'Japanese_instrument_of_surrender.jpg',
  'chinese-civil-war': 'Mao_Zedong_proclaiming_the_establishment_of_the_PRC_in_1949.jpg',
  'battle-morgarten': 'Schlacht_bei_Morgarten.jpg',
  'reconquista-granada': 'The_Surrender_of_Granada_-_Pradilla.jpg',
  'canary-islands-conquest': 'Conquista_de_Tenerife.jpg',
  'napoleon-russia-1812': 'Napoleon_retreat_from_Moscow.jpg',
  'battle-waterloo': 'Battle_of_Waterloo_1815.PNG',
  'franco-prussian-war': 'Battle_of_Sedan.jpg',
}

const NEW_IDS = new Set(Object.keys(CURATED))

function curlJson(url) {
  const r = spawnSync(
    'curl',
    ['-fsSL', '-A', 'EurasiaHistoryMap/1.0 (educational)', url],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  )
  if (r.status !== 0) return null
  try {
    return JSON.parse(r.stdout)
  } catch {
    return null
  }
}

function download(url, dest) {
  const r = spawnSync(
    'curl',
    ['-fsSL', '-A', 'EurasiaHistoryMap/1.0 (educational)', '-o', dest, url],
    { encoding: 'utf8' },
  )
  if (r.status !== 0 || !existsSync(dest)) return false
  const st = spawnSync('wc', ['-c', dest], { encoding: 'utf8' })
  const bytes = Number((st.stdout || '').trim().split(/\s+/)[0] || 0)
  return bytes > 2000
}

function toJpeg(src, dest) {
  const r = spawnSync(
    'magick',
    [
      src,
      '-auto-orient',
      '-resize',
      '800x533^',
      '-gravity',
      'center',
      '-extent',
      '800x533',
      '-quality',
      '85',
      dest,
    ],
    { encoding: 'utf8' },
  )
  return r.status === 0 && existsSync(dest)
}

function commonsFileUrl(title, width = 800) {
  const file = title.replace(/^File:/i, '')
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`
}

function commonsPageUrl(title) {
  const file = title.replace(/^File:/i, '')
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`
}

function searchCommons(query) {
  const url =
    'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      list: 'search',
      srnamespace: '6',
      srlimit: '8',
      srsearch: query,
    })
  const data = curlJson(url)
  const hits = data?.query?.search ?? []
  return hits
    .map((h) => h.title)
    .filter((t) => /\.(jpe?g|png|gif|tif|webp)$/i.test(t))
}

function writeFallbackSvg(title, destSvg) {
  const safe = String(title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  writeFileSync(
    destSvg,
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="533" viewBox="0 0 800 533">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2c1810"/><stop offset="100%" stop-color="#8a4a28"/>
  </linearGradient></defs>
  <rect width="800" height="533" fill="url(#g)"/>
  <text x="400" y="255" text-anchor="middle" fill="#f5e6c8" font-family="Georgia,serif" font-size="26">${safe.slice(0, 40)}</text>
</svg>`,
  )
}

function rm(...paths) {
  for (const p of paths) {
    try {
      if (existsSync(p)) unlinkSync(p)
    } catch {
      /* ignore */
    }
  }
}

const events = JSON.parse(readFileSync(eventsPath, 'utf8'))
let ok = 0
let fail = 0

for (const e of events) {
  if (!NEW_IDS.has(e.id)) continue
  if (only && !only.has(e.id)) continue

  const jpg = join(outDir, `${e.id}.jpg`)
  const tmp = join(outDir, `.tmp-${e.id}`)
  const candidates = []
  if (CURATED[e.id]) candidates.push(`File:${CURATED[e.id]}`)
  const q = e.i18n?.en?.name ?? e.id
  for (const t of searchCommons(q)) candidates.push(t)
  // zh name sometimes helps for China events
  if (e.i18n?.zh?.name) {
    for (const t of searchCommons(e.i18n.zh.name)) candidates.push(t)
  }

  let got = false
  let usedTitle = null
  for (const title of [...new Set(candidates)].slice(0, 12)) {
    const url = commonsFileUrl(title)
    rm(tmp)
    if (!download(url, tmp)) continue
    if (!toJpeg(tmp, jpg)) continue
    got = true
    usedTitle = title
    break
  }

  if (!got) {
    const svg = join(outDir, `.tmp-${e.id}.svg`)
    writeFallbackSvg(e.i18n?.en?.name ?? e.id, svg)
    if (!toJpeg(svg, jpg)) {
      fail++
      console.log('FAIL', e.id)
      rm(tmp, svg)
      continue
    }
    e.image = {
      url: `/images/events/${e.id}.jpg`,
      credit: 'Original educational illustration created for Eurasia History Map',
      license: 'Original / no third-party photo IP',
      origin: 'generated',
    }
    console.log('fallback', e.id)
    ok++
    rm(tmp, svg)
    continue
  }

  e.image = {
    url: `/images/events/${e.id}.jpg`,
    credit: `Wikimedia Commons — ${usedTitle.replace(/^File:/, '')}`,
    sourceUrl: commonsPageUrl(usedTitle),
    license: 'Public Domain / CC (Wikimedia Commons)',
    origin: 'wikimedia',
  }
  console.log('ok', e.id, '←', usedTitle)
  ok++
  rm(tmp)
}

writeFileSync(eventsPath, JSON.stringify(events, null, 2) + '\n')
console.log(`Done. ok=${ok} fail=${fail}`)
