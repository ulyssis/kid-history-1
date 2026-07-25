import type { HistoricEvent, Lang } from '../types'
import {
  FAMILY_LABEL,
  familyLabel,
  familyOf,
  findCuratedRelation,
} from './relations'

const FAMILY_KEYWORDS: Record<string, string[]> = {
  rome: ['rome', 'roman', '罗马', 'römi'],
  carthage: ['carthage', 'punic', 'hannibal', '迦太基', '布匿', 'karthago'],
  china: [
    'china',
    'han',
    'qin',
    'tang',
    'song',
    'ming',
    'qing',
    '中国',
    '汉',
    '秦',
    '唐',
    '宋',
    '明',
    '清',
    'beijing',
    'chang’an',
    'changan',
  ],
  persia: ['persia', 'iran', 'parthia', 'sasan', '波斯', '安息', '萨珊', 'parth'],
  greece: ['greece', 'greek', 'macedon', 'alexander', '希腊', '马其顿', 'griech'],
  egypt: ['egypt', 'nile', '埃及', 'ägypten'],
  britain: ['britain', 'british', 'england', '英国', 'brit'],
  france: ['france', 'french', 'napoleon', '法国', 'frankreich', 'französ'],
  germany: ['german', 'prussia', 'teutoburg', '德国', '普鲁士', 'deutsch', 'preuß'],
  russia: [
    'russia',
    'russian',
    'soviet',
    'kievan',
    'rus’',
    'rus ',
    'moscow',
    '俄国',
    '俄罗斯',
    '苏俄',
    '基辅',
    '罗斯',
    '莫斯科',
    'sowjet',
    'russland',
  ],
  japan: ['japan', 'japanese', '日本'],
  mongol: [
    'mongol',
    'genghis',
    'yuan',
    'golden',
    'horde',
    'tatar',
    '蒙古',
    '成吉思',
    '金帐',
    '鞑靼',
  ],
  tibet: ['tibet', '吐蕃', '文成'],
  steppe: ['xiongnu', '匈奴', 'steppe', 'turk'],
  caliphate: ['caliph', 'baghdad', 'islam', 'umayyad', 'abbasid', '哈里发'],
  byzantium: ['byzant', 'constantinople', '拜占庭', '君士坦丁'],
  ottoman: ['ottoman', '奥斯曼', 'osman'],
  india: ['india', 'maurya', 'gupta', 'mughal', '印度', '莫卧'],
  spain: ['spain', 'spanish', 'armada', 'granada', '西班牙'],
  mesopotamia: ['sumer', 'babylon', 'mesopotamia', '两河', '巴比伦', '苏美尔'],
  assyria: ['assyria', '亚述'],
}

function eventBlob(e: HistoricEvent): string {
  const parts = [e.id]
  for (const lang of ['en', 'de', 'zh'] as Lang[]) {
    const t = e.i18n[lang]
    if (t) parts.push(t.name, t.location, t.consequence)
  }
  return parts.join(' ').toLowerCase()
}

function eventMentionsFamily(e: HistoricEvent, familyId: string): boolean {
  const keys = FAMILY_KEYWORDS[familyId]
  if (!keys) return false
  const blob = eventBlob(e)
  return keys.some((k) => blob.includes(k.toLowerCase()))
}

export interface RelationResult {
  familyA: string
  familyB: string
  labelA: string
  labelB: string
  overall: string
  events: HistoricEvent[]
  curated: boolean
}

const SAME_FAMILY: Record<Lang, string> = {
  en: 'You picked two lands from the same broader civilization group. Try choosing two different civilizations.',
  de: 'Du hast zwei Gebiete derselben größeren Zivilisationsgruppe gewählt. Wähle zwei unterschiedliche Zivilisationen.',
  zh: '你选择的是同一文明系统下的两个区域。请改选两个不同的文明/国家。',
}

const FALLBACK_WITH_EVENTS: Record<Lang, string> = {
  en: 'Here are map events that connect both sides. Tap one to learn more.',
  de: 'Hier sind Karten-Ereignisse, die beide Seiten verbinden. Tippe eines an, um mehr zu erfahren.',
  zh: '以下是同时关联双方的地图事件，点击可了解详情。',
}

const FALLBACK_EMPTY: Record<Lang, string> = {
  en: 'No shared events are listed for this pair yet.',
  de: 'Für dieses Paar sind noch keine gemeinsamen Ereignisse hinterlegt.',
  zh: '这一对暂无收录的共同事件。',
}

export function buildRelation(
  polityIdA: string,
  polityIdB: string,
  allEvents: HistoricEvent[],
  lang: Lang,
): RelationResult {
  const familyA = familyOf(polityIdA)
  const familyB = familyOf(polityIdB)
  const labelA = familyLabel(familyA, lang)
  const labelB = familyLabel(familyB, lang)

  if (familyA === familyB) {
    return {
      familyA,
      familyB,
      labelA,
      labelB,
      overall: SAME_FAMILY[lang] ?? SAME_FAMILY.en,
      events: [],
      curated: false,
    }
  }

  const curated = findCuratedRelation(polityIdA, polityIdB)
  const byId = new Map(allEvents.map((e) => [e.id, e]))

  let events: HistoricEvent[] = []
  if (curated) {
    events = curated.eventIds
      .map((id) => byId.get(id))
      .filter((e): e is HistoricEvent => !!e)
  }

  // Also pull heuristic matches (and for non-curated pairs).
  const heuristic = allEvents.filter(
    (e) =>
      eventMentionsFamily(e, familyA) && eventMentionsFamily(e, familyB),
  )
  const seen = new Set(events.map((e) => e.id))
  for (const e of heuristic) {
    if (!seen.has(e.id)) {
      events.push(e)
      seen.add(e.id)
    }
  }

  events.sort((a, b) => a.startYear - b.startYear || a.id.localeCompare(b.id))

  let overall: string
  if (curated) {
    overall = curated.overall[lang] ?? curated.overall.en
  } else if (events.length > 0) {
    overall = FALLBACK_WITH_EVENTS[lang] ?? FALLBACK_WITH_EVENTS.en
  } else {
    overall = FALLBACK_EMPTY[lang] ?? FALLBACK_EMPTY.en
  }

  return {
    familyA,
    familyB,
    labelA,
    labelB,
    overall,
    events: events.slice(0, 12),
    curated: !!curated,
  }
}

export function displayFamilyName(
  familyId: string,
  lang: Lang,
): string {
  return FAMILY_LABEL[familyId]?.[lang] ?? familyId
}
