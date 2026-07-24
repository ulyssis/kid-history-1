import type { Lang } from '../types'

/** Collapse many map polity IDs into a smaller “civilization family” for relations. */
export const POLITY_FAMILY: Record<string, string> = {
  'egypt-early': 'egypt',
  'egypt-ok': 'egypt',
  'egypt-mk': 'egypt',
  'egypt-nk': 'egypt',
  'egypt-late': 'egypt',
  ptolemaic: 'egypt',
  sumer: 'mesopotamia',
  akkad: 'mesopotamia',
  'ur-iii': 'mesopotamia',
  'old-babylon': 'mesopotamia',
  'middle-assyria': 'assyria',
  'neo-assyria': 'assyria',
  'neo-babylon': 'mesopotamia',
  phoenicia: 'phoenicia',
  carthage: 'carthage',
  hittite: 'hittite',
  indus: 'india',
  maurya: 'india',
  gupta: 'india',
  delhi: 'india',
  mughal: 'india',
  'british-india': 'britain',
  india: 'india',
  'yellow-river': 'china',
  shang: 'china',
  zhou: 'china',
  'eastern-zhou': 'china',
  'warring-states': 'china',
  qin: 'china',
  han: 'china',
  'three-kingdoms': 'china',
  'jin-sui': 'china',
  tang: 'china',
  song: 'china',
  'south-song': 'china',
  yuan: 'china',
  ming: 'china',
  qing: 'china',
  'roc-prc': 'china',
  minoan: 'greece',
  mycenae: 'greece',
  'classical-greece': 'greece',
  macedon: 'greece',
  alexander: 'greece',
  'macedon-late': 'greece',
  achaemenid: 'persia',
  seleucid: 'persia',
  'parthia-early': 'persia',
  parthia: 'persia',
  sasanian: 'persia',
  safavid: 'persia',
  qajar: 'persia',
  iran: 'persia',
  'rome-early': 'rome',
  'rome-west-med': 'rome',
  'roman-empire': 'rome',
  wre: 'rome',
  byzantine: 'byzantium',
  'byzantine-late': 'byzantium',
  'rashidun-umayyad': 'caliphate',
  abbasid: 'caliphate',
  fatimid: 'caliphate',
  mamluk: 'caliphate',
  carolingian: 'france',
  hre: 'germany',
  kievan: 'russia',
  'russia-tsardom': 'russia',
  'russian-empire': 'russia',
  ussr: 'russia',
  russia: 'russia',
  france: 'france',
  napoleonic: 'france',
  spain: 'spain',
  britain: 'britain',
  'poland-lith': 'poland',
  austria: 'austria',
  prussia: 'germany',
  'eu-core': 'europe',
  ottoman: 'ottoman',
  mongol: 'mongol',
  'golden-horde': 'mongol',
  'tibet-empire': 'tibet',
  japan: 'japan',
  'tokugawa': 'japan',
  'meiji-japan': 'japan',
  'xiongnu': 'steppe',
  'turkic': 'steppe',
  'kushan': 'central-asia',
}

export const FAMILY_LABEL: Record<string, Record<Lang, string>> = {
  egypt: { en: 'Egypt', de: 'Ägypten', zh: '埃及' },
  mesopotamia: { en: 'Mesopotamia', de: 'Mesopotamien', zh: '美索不达米亚' },
  assyria: { en: 'Assyria', de: 'Assyrien', zh: '亚述' },
  phoenicia: { en: 'Phoenicia', de: 'Phönizien', zh: '腓尼基' },
  carthage: { en: 'Carthage', de: 'Karthago', zh: '迦太基' },
  hittite: { en: 'Hittites', de: 'Hethiter', zh: '赫梯' },
  india: { en: 'India', de: 'Indien', zh: '印度' },
  china: { en: 'China', de: 'China', zh: '中国' },
  greece: { en: 'Greece / Macedon', de: 'Griechenland / Makedonien', zh: '希腊/马其顿' },
  persia: { en: 'Persia / Iran', de: 'Persien / Iran', zh: '波斯/伊朗' },
  rome: { en: 'Rome', de: 'Rom', zh: '罗马' },
  byzantium: { en: 'Byzantium', de: 'Byzanz', zh: '拜占庭' },
  caliphate: { en: 'Islamic Caliphates', de: 'Islamische Kalifate', zh: '伊斯兰哈里发' },
  france: { en: 'France', de: 'Frankreich', zh: '法国' },
  germany: { en: 'German states', de: 'Deutsche Staaten', zh: '德意志诸邦' },
  russia: { en: 'Russia', de: 'Russland', zh: '俄国' },
  spain: { en: 'Spain', de: 'Spanien', zh: '西班牙' },
  britain: { en: 'Britain', de: 'Britannien', zh: '英国' },
  poland: { en: 'Poland–Lithuania', de: 'Polen-Litauen', zh: '波兰立陶宛' },
  austria: { en: 'Austria / Habsburgs', de: 'Österreich / Habsburger', zh: '奥地利/哈布斯堡' },
  europe: { en: 'European states', de: 'Europäische Staaten', zh: '欧洲国家' },
  ottoman: { en: 'Ottoman Empire', de: 'Osmanisches Reich', zh: '奥斯曼帝国' },
  mongol: { en: 'Mongols', de: 'Mongolen', zh: '蒙古' },
  tibet: { en: 'Tibet', de: 'Tibet', zh: '吐蕃/西藏' },
  japan: { en: 'Japan', de: 'Japan', zh: '日本' },
  steppe: { en: 'Steppe peoples', de: 'Steppenvölker', zh: '草原民族' },
  'central-asia': { en: 'Central Asia', de: 'Zentralasien', zh: '中亚' },
}

export interface CuratedRelation {
  a: string
  b: string
  overall: Record<Lang, string>
  eventIds: string[]
}

/** Hand-written summaries for important civilization pairs (order-independent). */
export const CURATED_RELATIONS: CuratedRelation[] = [
  {
    a: 'rome',
    b: 'carthage',
    overall: {
      en: 'Rome and Carthage were fierce Mediterranean rivals. Three Punic Wars ended with Carthage destroyed and Rome dominant in the west.',
      de: 'Rom und Karthago waren erbitterte Rivalen im Mittelmeer. Drei Punische Kriege endeten mit der Zerstörung Karthagos.',
      zh: '罗马与迦太基是地中海强敌。三次布匿战争后迦太基灭亡，罗马主导西地中海。',
    },
    eventIds: ['first-punic', 'second-punic', 'third-punic'],
  },
  {
    a: 'rome',
    b: 'china',
    overall: {
      en: 'Rome and Han China were far apart but linked by rumor, silk, and the Silk Road. They rarely met directly, yet each knew a distant “great power” existed.',
      de: 'Rom und Han-China lagen weit auseinander, verbunden durch Gerüchte, Seide und die Seidenstraße — selten direkter Kontakt.',
      zh: '罗马与汉朝相隔遥远，经丝绸之路与传说间接相连，鲜有直接往来，却各自知晓远方有大国。',
    },
    eventIds: [
      'silk-road',
      'pair-509-confucius-era',
      'pair-218-qin-han',
      'pair-27-han-wudi-prelude',
      'pair-9-teutoburg-wangmang',
      'pair-105-paper-trajan',
      'pair-184-commodus',
      'pair-220-severan-end',
      'han-silk-to-rome',
      'zhang-qian',
    ],
  },
  {
    a: 'rome',
    b: 'persia',
    overall: {
      en: 'Rome (and later Byzantium) fought long frontier wars with Parthia and Sasanian Persia — diplomacy and conflict along the Euphrates.',
      de: 'Rom (später Byzanz) führte lange Grenzkämpfe mit Parthern und Sasaniden — Diplomatie und Krieg am Euphrat.',
      zh: '罗马（及后来的拜占庭）与帕提亚、萨珊波斯长期对峙，幼发拉底河一线战和交替。',
    },
    eventIds: ['trajan-peak', 'crisis-third-century'],
  },
  {
    a: 'rome',
    b: 'greece',
    overall: {
      en: 'Rome absorbed Greek culture while conquering the Hellenistic world. Greek learning deeply shaped Roman elite life.',
      de: 'Rom eroberte die hellenistische Welt und übernahm griechische Kultur — Bildung prägte die römische Elite.',
      zh: '罗马征服希腊化世界的同时吸收希腊文化，深刻影响罗马精英生活。',
    },
    eventIds: ['pyrrhic-war', 'actium', 'alexander'],
  },
  {
    a: 'greece',
    b: 'persia',
    overall: {
      en: 'Greek city-states and Macedon clashed with the Achaemenid Empire — from Marathon to Alexander’s conquest of Persia.',
      de: 'Griechische Poleis und Makedonien kämpften gegen die Achämeniden — von Marathon bis zu Alexanders Eroberung.',
      zh: '希腊城邦与马其顿对抗阿契美尼德波斯——从马拉松到亚历山大东征。',
    },
    eventIds: ['marathon', 'alexander', 'cyrus-persia'],
  },
  {
    a: 'china',
    b: 'steppe',
    overall: {
      en: 'Chinese empires and northern steppe confederations (like the Xiongnu) traded, fought, and negotiated for centuries along the frontier.',
      de: 'Chinesische Reiche und Steppenkonföderationen (z. B. Xiongnu) handelten, kämpften und verhandelten jahrhundertelang.',
      zh: '中原王朝与北方草原势力（如匈奴）长期战和、互市与和亲。',
    },
    eventIds: ['baideng-siege', 'han-xiongnu-war', 'great-wall-qin', 'zhang-qian'],
  },
  {
    a: 'china',
    b: 'tibet',
    overall: {
      en: 'Tang China and the Tibetan Empire mixed war with marriage alliances — Princess Wencheng became a famous symbol of ties.',
      de: 'Tang-China und das Tibetische Reich mischten Krieg mit Heiratsallianzen — Prinzessin Wencheng wurde zum Symbol.',
      zh: '唐朝与吐蕃战和交织，文成公主入藏成为汉藏友好象征。',
    },
    eventIds: ['wencheng-tibet'],
  },
  {
    a: 'china',
    b: 'mongol',
    overall: {
      en: 'Mongol conquest ended the Song and created the Yuan dynasty in China; later Ming and Qing reshaped Inner Asian borders.',
      de: 'Die Mongolen eroberten die Song und gründeten die Yuan in China; Ming und Qing formten später die Grenzen neu.',
      zh: '蒙古灭宋建元；此后明、清继续塑造与 Inner Asia 的关系。',
    },
    eventIds: ['genghis', 'diaoyu-fortress', 'battle-of-yamen', 'yuan-invade-japan', 'ming-found', 'tumu-crisis'],
  },
  {
    a: 'mongol',
    b: 'russia',
    overall: {
      en: 'Mongol armies crushed Kievan Rus’ in the 1200s. For about 240 years many Russian lands paid tribute to the Golden Horde (“Tatar yoke”). Moscow later rose, threw off Horde power, and expanded east across former Mongol steppe lands.',
      de: 'Mongolenheere zerschlugen im 13. Jh. die Kiewer Rus. Etwa 240 Jahre zahlten viele russische Länder der Goldenen Horde Tribut („Tatarisches Joch“). Moskau stieg später auf, warf die Hordenmacht ab und dehnte sich nach Osten aus.',
      zh: '13世纪蒙古军击溃基辅罗斯。此后约两个半世纪，许多罗斯公国向金帐汗国纳贡（“鞑靼枷锁”）。莫斯科崛起后摆脱金帐统治，并向东扩张进入昔日蒙古草原地带。',
    },
    eventIds: ['genghis', 'mongol-invade-rus'],
  },
  {
    a: 'china',
    b: 'japan',
    overall: {
      en: 'China and Japan shared writing and Buddhism early on, later clashed in invasions and modern wars, then rebuilt ties in new forms.',
      de: 'China und Japan teilten Schrift und Buddhismus, später Invasionen und moderne Kriege — danach neue Beziehungen.',
      zh: '中日早有文字与佛教交流，后有元军征日、壬辰战争与近代冲突，关系几经变迁。',
    },
    eventIds: ['yuan-invade-japan', 'imjin-war', 'sino-japanese-1895', 'mukden-incident', 'nanjing-massacre', 'japan-surrender'],
  },
  {
    a: 'china',
    b: 'britain',
    overall: {
      en: 'From limited Canton trade to the Opium Wars, Britain forced unequal treaties that shook Qing China.',
      de: 'Vom Kantonhandel zu den Opiumkriegen: Britannien erzwang ungleiche Verträge und erschütterte Qing-China.',
      zh: '从广州一口通商到鸦片战争，英国迫使清朝签订不平等条约。',
    },
    eventIds: ['canton-system-1757', 'macartney-1793', 'opium-war', 'second-opium-war'],
  },
  {
    a: 'china',
    b: 'russia',
    overall: {
      en: 'Qing China and Russia fixed early borders at Nerchinsk, later competed in Manchuria and along railways.',
      de: 'Qing-China und Russland zogen früh Grenzen in Nertschinsk und rivalisierten später in der Mandschurei.',
      zh: '清与俄国以尼布楚条约划界，后来在东北与铁路问题上再起冲突。',
    },
    eventIds: ['treaty-nerchinsk', 'sino-soviet-1929'],
  },
  {
    a: 'china',
    b: 'france',
    overall: {
      en: 'France fought Qing China in the late 1800s (including the surprise attack at Mawei) and joined unequal treaty pressure.',
      de: 'Frankreich kämpfte Ende des 19. Jh. gegen Qing-China (u. a. Mawei) und drängte auf ungleiche Verträge.',
      zh: '19世纪末法国与清朝冲突（含马尾海战），并参与强迫签约。',
    },
    eventIds: ['battle-mawei', 'second-opium-war'],
  },
  {
    a: 'egypt',
    b: 'mesopotamia',
    overall: {
      en: 'Two early river civilizations — sometimes distant peers, sometimes linked through trade and Near Eastern diplomacy.',
      de: 'Zwei frühe Flusszivilisationen — oft ferne Zeitgenossen, manchmal durch Handel und Diplomatie verbunden.',
      zh: '两大早期大河文明：多为同时代的远方社会，偶有贸易与近东外交联系。',
    },
    eventIds: ['egypt-unification', 'uruk-urban', 'cuneiform', 'hammurabi'],
  },
  {
    a: 'egypt',
    b: 'rome',
    overall: {
      en: 'Egypt became vital Roman grain land after Cleopatra’s fall; Alexandria stayed a cultural capital of the empire.',
      de: 'Nach Kleopatras Fall wurde Ägypten Roms Kornkammer; Alexandria blieb eine Kulturmetropole.',
      zh: '克利奥帕特拉之后埃及成为罗马粮仓，亚历山大港仍是帝国文化重镇。',
    },
    eventIds: ['actium', 'augustus-principate'],
  },
  {
    a: 'france',
    b: 'germany',
    overall: {
      en: 'France and German states fought repeatedly in modern times — notably the Franco-Prussian War that helped create the German Empire.',
      de: 'Frankreich und deutsche Staaten kämpften in der Neuzeit wiederholt — besonders 1870/71.',
      zh: '近代法德多次交战，普法战争推动德意志帝国成立。',
    },
    eventIds: ['franco-prussian-war', 'german-empire-1871', 'ww1', 'ww2'],
  },
  {
    a: 'france',
    b: 'britain',
    overall: {
      en: 'Long rivalry and occasional alliance — from medieval wars to colonial competition and later coalition against Napoleon.',
      de: 'Lange Rivalität und zeitweise Allianz — von mittelalterlichen Kriegen bis zur Koalition gegen Napoleon.',
      zh: '英法长期竞争也偶有同盟——从中世纪战争到反拿破仑联盟。',
    },
    eventIds: ['seven-years-war', 'napoleon', 'battle-waterloo', 'napoleon-russia-1812'],
  },
  {
    a: 'france',
    b: 'russia',
    overall: {
      en: 'Napoleon’s 1812 invasion of Russia was a disaster and a turning point of the Napoleonic Wars.',
      de: 'Napoleons Russlandfeldzug 1812 wurde zur Katastrophe und zum Wendepunkt.',
      zh: '拿破仑1812年侵俄惨败，成为拿破仑战争转折点。',
    },
    eventIds: ['napoleon-russia-1812', 'napoleon', 'battle-waterloo'],
  },
  {
    a: 'byzantium',
    b: 'caliphate',
    overall: {
      en: 'Byzantium and the early caliphates fought over the Levant and Anatolia while also trading and exchanging knowledge.',
      de: 'Byzanz und frühe Kalifate kämpften um Levante und Anatolien — bei Handel und Wissensaustausch.',
      zh: '拜占庭与早期哈里发在黎凡特、安纳托利亚战和交织，也有贸易与知识往来。',
    },
    eventIds: ['battle-talas', 'constantinople-1453'],
  },
  {
    a: 'byzantium',
    b: 'ottoman',
    overall: {
      en: 'The Ottomans pressed Byzantium for centuries and finally took Constantinople in 1453.',
      de: 'Die Osmanen bedrängten Byzanz jahrhundertelang und eroberten 1453 Konstantinopel.',
      zh: '奥斯曼长期挤压拜占庭，1453年攻陷君士坦丁堡。',
    },
    eventIds: ['constantinople-1453', 'ottoman-suleiman'],
  },
  {
    a: 'spain',
    b: 'britain',
    overall: {
      en: 'Sea-power rivals in the Atlantic age — the Spanish Armada campaign is the most famous clash.',
      de: 'Seemachtsrivalen im Atlantikzeitalter — die Armada ist der berühmteste Zusammenstoß.',
      zh: '大西洋时代的海权对手，无敌舰队远征是著名冲突。',
    },
    eventIds: ['spanish-armada', 'columbus'],
  },
]

export function familyOf(polityId: string): string {
  return POLITY_FAMILY[polityId] ?? polityId
}

export function familyLabel(familyId: string, lang: Lang): string {
  return FAMILY_LABEL[familyId]?.[lang] ?? FAMILY_LABEL[familyId]?.en ?? familyId
}

export function findCuratedRelation(
  polityIdA: string,
  polityIdB: string,
): CuratedRelation | null {
  const a = familyOf(polityIdA)
  const b = familyOf(polityIdB)
  if (a === b) return null
  return (
    CURATED_RELATIONS.find(
      (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a),
    ) ?? null
  )
}
