/**
 * Create a local SVG illustration for every event and point image.url at it.
 * (Remote Commons/Baidu URLs often fail offline or behind proxies.)
 * Run: node scripts/generate-event-images.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const eventsPath = join(root, 'public/data/events.json')
const outDir = join(root, 'public/images/events')
mkdirSync(outDir, { recursive: true })

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function theme(event) {
  const t = `${event.id} ${event.i18n?.en?.name ?? ''} ${event.i18n?.en?.location ?? ''}`.toLowerCase()
  if (/rome|roman|caesar|augustus|gaul|carthage|punic|byzant|constantin|vesuvius|trajan|rubicon/.test(t)) {
    return { bg1: '#3b1f1f', bg2: '#8b0000', accent: '#f0d78c', motif: 'rome' }
  }
  if (/china|han|qin|ming|qing|tang|song|beijing|chang|confuc|silk|taiping|may.fourth|zheng|macau|canton|macartney|tumu|nurhaci|cai.lun|yellow.turban|red.cliff/.test(t)) {
    return { bg1: '#3a2210', bg2: '#c45c26', accent: '#f2e6c8', motif: 'china' }
  }
  if (/persia|iran|achaemen|cyrus|parthia|sasan|safavid/.test(t)) {
    return { bg1: '#2a2410', bg2: '#b8860b', accent: '#ffe6a0', motif: 'persia' }
  }
  if (/egypt|pyramid|nile|pharaoh|ptolem/.test(t)) {
    return { bg1: '#2a2618', bg2: '#c9a227', accent: '#fff1c2', motif: 'egypt' }
  }
  if (/islam|baghdad|ottoman|umayyad|abbasid|muhammad/.test(t)) {
    return { bg1: '#123028', bg2: '#2e8b57', accent: '#d7f5e4', motif: 'islam' }
  }
  if (/mongol|genghis|timur|steppe/.test(t)) {
    return { bg1: '#1a1010', bg2: '#a52a2a', accent: '#f5d0d0', motif: 'steppe' }
  }
  if (/greece|athens|olympia|alexander|macedon|marathon|byzant/.test(t)) {
    return { bg1: '#152033', bg2: '#4a6fa5', accent: '#dce8ff', motif: 'greece' }
  }
  if (/europe|luther|armada|westphal|vienna|versailles|berlin|napoleon|french|german|britain|industrial/.test(t)) {
    return { bg1: '#1a2430', bg2: '#3d5a45', accent: '#e8f0e6', motif: 'europe' }
  }
  return { bg1: '#1e2a1c', bg2: '#5a7a55', accent: '#f7f4ec', motif: 'world' }
}

function motifPath(motif, accent) {
  switch (motif) {
    case 'rome':
      return `<rect x="340" y="120" width="120" height="160" rx="4" fill="${accent}" opacity="0.9"/>
        <rect x="320" y="100" width="160" height="28" rx="3" fill="${accent}"/>
        <rect x="355" y="140" width="18" height="100" fill="#3b1f1f"/>
        <rect x="391" y="140" width="18" height="100" fill="#3b1f1f"/>
        <rect x="427" y="140" width="18" height="100" fill="#3b1f1f"/>`
    case 'china':
      return `<path d="M400 110 L470 170 L450 170 L450 250 L350 250 L350 170 L330 170 Z" fill="${accent}" opacity="0.95"/>
        <rect x="370" y="190" width="60" height="60" fill="#3a2210"/>
        <rect x="390" y="210" width="20" height="40" fill="${accent}"/>`
    case 'egypt':
      return `<path d="M400 115 L500 260 L300 260 Z" fill="${accent}" opacity="0.92"/>
        <rect x="385" y="210" width="30" height="50" fill="#2a2618"/>`
    case 'greece':
      return `<polygon points="400,115 460,250 340,250" fill="none" stroke="${accent}" stroke-width="10"/>
        <circle cx="400" cy="180" r="28" fill="${accent}" opacity="0.85"/>`
    case 'persia':
      return `<circle cx="400" cy="190" r="70" fill="none" stroke="${accent}" stroke-width="10"/>
        <path d="M400 130 L430 210 L370 210 Z" fill="${accent}"/>`
    case 'islam':
      return `<path d="M360 250 Q400 100 440 250 Z" fill="${accent}" opacity="0.9"/>
        <circle cx="430" cy="150" r="22" fill="none" stroke="${accent}" stroke-width="8"/>`
    case 'steppe':
      return `<path d="M300 220 Q400 140 500 220" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
        <circle cx="360" cy="200" r="14" fill="${accent}"/>
        <circle cx="440" cy="195" r="14" fill="${accent}"/>`
    case 'europe':
      return `<rect x="345" y="140" width="110" height="120" rx="8" fill="${accent}" opacity="0.9"/>
        <path d="M345 180 H455 M375 140 V260 M425 140 V260" stroke="#1a2430" stroke-width="6"/>`
    default:
      return `<circle cx="400" cy="190" r="75" fill="${accent}" opacity="0.85"/>
        <circle cx="400" cy="190" r="40" fill="none" stroke="#1e2a1c" stroke-width="8"/>`
  }
}

function makeSvg(event) {
  const { bg1, bg2, accent, motif } = theme(event)
  const title = escapeXml(event.i18n?.en?.name ?? event.id)
  const loc = escapeXml(event.i18n?.en?.location ?? '')
  const year =
    event.startYear === event.endYear
      ? String(event.startYear)
      : `${event.startYear}–${event.endYear}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="120" cy="80" r="90" fill="${accent}" opacity="0.08"/>
  <circle cx="700" cy="380" r="120" fill="${accent}" opacity="0.1"/>
  ${motifPath(motif, accent)}
  <text x="400" y="320" text-anchor="middle" fill="${accent}" font-family="Georgia, 'Noto Serif SC', serif" font-size="28" font-weight="700">${title.length > 42 ? title.slice(0, 40) + '…' : title}</text>
  <text x="400" y="355" text-anchor="middle" fill="${accent}" opacity="0.85" font-family="system-ui, sans-serif" font-size="18">${loc.length > 50 ? loc.slice(0, 48) + '…' : loc}</text>
  <text x="400" y="395" text-anchor="middle" fill="${accent}" opacity="0.7" font-family="system-ui, sans-serif" font-size="16">${escapeXml(year)}</text>
</svg>
`
}

const events = JSON.parse(readFileSync(eventsPath, 'utf8'))
let n = 0
for (const e of events) {
  const file = `${e.id}.svg`
  writeFileSync(join(outDir, file), makeSvg(e))
  e.image = {
    url: `/images/events/${file}`,
    credit: 'Illustration created for Eurasia History Map (educational)',
    sourceUrl: undefined,
  }
  n++
}
writeFileSync(eventsPath, JSON.stringify(events, null, 2) + '\n')
console.log(`Wrote ${n} local event illustrations to public/images/events/`)
