/**
 * Generate territory snapshots on a variable grid plus every event year:
 *   3700–800 BCE: every 100 years
 *   800 BCE–1492 CE: every 50 years
 *   1492–2026 CE: every 20 years
 * Polities are approximate educational polygons timed from Wikipedia overviews.
 * Re-run: node scripts/generate-territories.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const terrDir = join(root, 'public/data/territories')
const eventsPath = join(root, 'public/data/events.json')
mkdirSync(terrDir, { recursive: true })

const N = (en, de, zh) => ({ en, de, zh })

function rect(w, s, e, n) {
  return {
    type: 'Polygon',
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  }
}

function poly(ring) {
  return { type: 'Polygon', coordinates: [ring] }
}

function feature(polityId, color, name, geometry, wiki) {
  return {
    type: 'Feature',
    properties: {
      polityId,
      color,
      name,
      note: 'Approximate educational outline',
      wiki,
    },
    geometry,
  }
}

/** Named geometries — extents informed by Wikipedia maps (simplified). */
const G = {
  egyptCore: rect(29.8, 22, 34.2, 31.4),
  egyptNewKingdom: poly([
    [25, 22], [37, 22], [37, 32], [34, 33], [29, 32], [25, 28], [25, 22],
  ]),
  nubia: rect(30, 15, 36, 22),
  lowerMesopotamia: rect(44, 30, 48.5, 33.8),
  upperMesopotamia: rect(40, 34.5, 45.5, 38),
  akkadian: poly([[40, 30], [49, 30], [49, 37], [42, 38], [40, 34], [40, 30]]),
  oldBabylon: rect(43, 30.5, 48, 34.5),
  neoAssyria: poly([[38, 33], [50, 32], [50, 38], [42, 42], [35, 38], [38, 33]]),
  neoBabylon: poly([[40, 29], [49, 29], [49, 36], [42, 37], [40, 33], [40, 29]]),
  hittite: rect(32, 36, 42, 42),
  levant: rect(34, 31, 37.2, 34.8),
  phoenicia: rect(34.6, 32.8, 36.4, 35.2),
  indus: rect(66, 23.5, 76, 32),
  // Early China cultures (approximate educational outlines)
  liangzhu: rect(119.2, 30.0, 121.2, 31.4), // Taihu / Hangzhou Bay
  longshan: rect(110, 33, 119, 38), // middle–lower Yellow River
  erlitou: rect(111.5, 33.8, 113.5, 35.2), // central Henan
  sanxingdui: rect(103.5, 30.4, 105.0, 31.6), // Guanghan / Chengdu Plain
  shang: rect(110, 32, 120, 40),
  westernZhou: rect(105, 32, 118, 40),
  warringStates: poly([[104, 25], [122, 25], [123, 42], [108, 42], [100, 36], [104, 25]]),
  qin: poly([[105, 28], [118, 28], [120, 40], [108, 41], [102, 34], [105, 28]]),
  han: poly([[98, 20], [122, 20], [126, 42], [108, 45], [95, 38], [98, 20]]),
  tang: poly([[85, 22], [125, 22], [128, 45], [100, 48], [80, 40], [85, 22]]),
  song: rect(108, 22, 122, 38),
  southSong: rect(110, 22, 122, 34),
  yuan: poly([[80, 20], [135, 18], [140, 50], [100, 55], [75, 42], [80, 20]]),
  ming: rect(100, 18, 123, 42),
  qing: poly([[73, 18], [135, 18], [140, 50], [100, 55], [70, 45], [73, 18]]),
  prc: poly([[73, 18], [135, 18], [135, 48], [100, 53], [73, 42], [73, 18]]),
  cycladic: rect(24.2, 36.3, 26.0, 37.9),
  minoan: rect(23.2, 34.7, 26.5, 35.7),
  mycenae: rect(21, 36, 27, 39.2),
  greece: rect(19.5, 36, 28.5, 41.5),
  macedonia: rect(20, 39, 28, 42.5),
  italy: rect(8, 37.5, 18.5, 46),
  carthage: poly([[-10, 30], [12, 30], [12, 37.5], [-5, 37.5], [-10, 34], [-10, 30]]),
  achaemenid: poly([
    [25, 24], [70, 24], [72, 40], [60, 44], [45, 42], [32, 38], [25, 32], [25, 24],
  ]),
  alexander: poly([
    [19, 24], [75, 24], [75, 42], [50, 44], [25, 42], [19, 36], [19, 24],
  ]),
  seleucidCore: rect(38, 30, 55, 40),
  ptolemaic: rect(25, 22, 36, 32),
  maurya: poly([[68, 12], [90, 12], [92, 32], [78, 34], [68, 28], [68, 12]]),
  gupta: rect(72, 15, 90, 30),
  delhi: rect(70, 12, 88, 30),
  mughal: poly([[68, 8], [92, 8], [94, 32], [78, 35], [68, 28], [68, 8]]),
  britishIndia: rect(68, 8, 92, 32),
  modernIndia: rect(68, 8, 90, 32),
  parthia: rect(44, 28, 68, 40),
  sasanian: poly([[40, 25], [68, 25], [70, 42], [48, 42], [40, 35], [40, 25]]),
  safavid: rect(44, 25, 64, 40),
  qajar: rect(44, 25, 63, 40),
  modernIran: rect(44, 25, 63, 40),
  romanRepublicItaly: rect(8, 37, 18.5, 46),
  romanWest: poly([[-10, 30], [20, 30], [25, 45], [5, 55], [-10, 48], [-10, 30]]),
  romanFull: poly([[-10, 28], [40, 28], [42, 45], [12, 55], [-10, 48], [-10, 28]]),
  romanEast: poly([[20, 30], [42, 30], [42, 45], [25, 45], [20, 30]]),
  byzantineEarly: poly([[20, 32], [42, 32], [42, 44], [26, 44], [20, 36], [20, 32]]),
  byzantineLate: poly([[22, 36], [36, 36], [36, 42], [26, 42], [22, 38], [22, 36]]),
  umayyad: poly([[-9, 28], [70, 18], [72, 40], [35, 42], [-5, 38], [-9, 28]]),
  abbasid: poly([[30, 18], [65, 18], [68, 40], [42, 42], [30, 34], [30, 18]]),
  fatimid: poly([[-5, 22], [38, 22], [38, 34], [10, 34], [-5, 30], [-5, 22]]),
  ayyubidMamluk: rect(29, 22, 37, 32),
  carolingian: rect(-5, 42, 16, 54),
  hre: rect(5, 45, 18, 55),
  france: rect(-5, 42.5, 8, 51),
  britain: rect(-8, 50, 2, 59),
  spain: rect(-9.5, 36, 3.5, 43.8),
  polandLith: rect(14, 48, 35, 58),
  kievanRus: rect(28, 48, 42, 60),
  moscow: rect(30, 52, 45, 60),
  russianEmpire: poly([[20, 45], [170, 45], [170, 72], [30, 72], [20, 55], [20, 45]]),
  ussr: poly([[20, 40], [170, 40], [170, 72], [30, 72], [20, 55], [20, 40]]),
  modernRussia: poly([[30, 48], [170, 48], [170, 72], [40, 72], [30, 55], [30, 48]]),
  mongolEmpire: poly([[20, 35], [135, 35], [140, 55], [60, 60], [20, 50], [20, 35]]),
  goldenHorde: rect(30, 44, 70, 55),
  ilkhanate: rect(40, 28, 68, 42),
  yuanCore: poly([[85, 22], [135, 22], [140, 50], [100, 55], [80, 42], [85, 22]]),
  ottomanRise: poly([[26, 36], [45, 36], [45, 43], [28, 43], [26, 38], [26, 36]]),
  ottomanPeak: poly([[13, 30], [48, 30], [48, 46], [26, 47], [13, 40], [13, 30]]),
  ottomanLate: poly([[20, 30], [45, 30], [45, 43], [26, 43], [20, 36], [20, 30]]),
  modernTurkey: rect(26, 36, 45, 42),
  tibetEmpire: rect(80, 28, 100, 36),
  silla: rect(126, 34, 130.5, 39),
  joseon: rect(124.5, 33.5, 130.5, 39),
  japanYamato: rect(130, 33, 141, 41),
  japanTokugawa: rect(129, 31, 146, 45),
  modernJapan: rect(129, 31, 146, 45),
  koreaModern: rect(124.5, 33.5, 130.5, 39),
  austriaHabs: rect(10, 45, 20, 50),
  prussia: rect(10, 50, 22, 55),
  napoleonicFrance: rect(-5, 42, 12, 51),
  euCore: rect(-5, 36, 25, 55),
  maghreb: rect(-10, 30, 12, 37),
  kushan: rect(60, 30, 80, 42),
  timurid: rect(55, 30, 75, 42),
}

/**
 * Polity active ranges [from, to] inclusive (astronomical years).
 * Timing cross-checked against Wikipedia period pages listed in `wiki`.
 */
const POLITIES = [
  // Egypt
  { id: 'egypt-early', color: '#c9a227', name: N('Early Dynastic Egypt', 'Frühdynastisches Ägypten', '埃及早王朝'), from: -3100, to: -2687, g: G.egyptCore, wiki: 'https://en.wikipedia.org/wiki/Early_Dynastic_Period_(Egypt)' },
  { id: 'egypt-ok', color: '#c9a227', name: N('Old Kingdom Egypt', 'Altes Reich Ägypten', '埃及古王国'), from: -2686, to: -2182, g: G.egyptCore, wiki: 'https://en.wikipedia.org/wiki/Old_Kingdom_of_Egypt' },
  { id: 'egypt-mk', color: '#c9a227', name: N('Middle Kingdom Egypt', 'Mittleres Reich Ägypten', '埃及中王国'), from: -2055, to: -1651, g: G.egyptCore, wiki: 'https://en.wikipedia.org/wiki/Middle_Kingdom_of_Egypt' },
  { id: 'egypt-nk', color: '#c9a227', name: N('New Kingdom Egypt', 'Neues Reich Ägypten', '埃及新王国'), from: -1550, to: -1070, g: G.egyptNewKingdom, wiki: 'https://en.wikipedia.org/wiki/New_Kingdom_of_Egypt' },
  { id: 'egypt-late', color: '#c9a227', name: N('Late Period Egypt', 'Spätzeit Ägypten', '埃及后期王朝'), from: -664, to: -333, g: G.egyptCore, wiki: 'https://en.wikipedia.org/wiki/Late_Period_of_ancient_Egypt' },
  { id: 'ptolemaic', color: '#c9a227', name: N('Ptolemaic Egypt', 'Ptolemäisches Ägypten', '托勒密埃及'), from: -305, to: -31, g: G.ptolemaic, wiki: 'https://en.wikipedia.org/wiki/Ptolemaic_Kingdom' },

  // Mesopotamia
  { id: 'sumer', color: '#8b5a2b', name: N('Sumerian city-states', 'Sumerische Stadtstaaten', '苏美尔城邦'), from: -3500, to: -2335, g: G.lowerMesopotamia, wiki: 'https://en.wikipedia.org/wiki/Sumer' },
  { id: 'akkad', color: '#8b5a2b', name: N('Akkadian Empire', 'Akkadisches Reich', '阿卡德帝国'), from: -2334, to: -2154, g: G.akkadian, wiki: 'https://en.wikipedia.org/wiki/Akkadian_Empire' },
  { id: 'ur-iii', color: '#8b5a2b', name: N('Third Dynasty of Ur', 'Dritte Dynastie von Ur', '乌尔第三王朝'), from: -2112, to: -2005, g: G.lowerMesopotamia, wiki: 'https://en.wikipedia.org/wiki/Third_Dynasty_of_Ur' },
  { id: 'old-babylon', color: '#8b5a2b', name: N('Old Babylonian kingdom', 'Altbabylonisches Reich', '古巴比伦王国'), from: -1894, to: -1596, g: G.oldBabylon, wiki: 'https://en.wikipedia.org/wiki/First_Babylonian_Empire' },
  { id: 'hittite', color: '#6b4c9a', name: N('Hittite Empire', 'Hethiterreich', '赫梯帝国'), from: -1650, to: -1180, g: G.hittite, wiki: 'https://en.wikipedia.org/wiki/Hittites' },
  { id: 'middle-assyria', color: '#a0522d', name: N('Middle Assyrian Empire', 'Mittelassyrisches Reich', '中亚述帝国'), from: -1365, to: -912, g: G.upperMesopotamia, wiki: 'https://en.wikipedia.org/wiki/Middle_Assyrian_Empire' },
  { id: 'neo-assyria', color: '#a0522d', name: N('Neo-Assyrian Empire', 'Neuassyrisches Reich', '新亚述帝国'), from: -911, to: -609, g: G.neoAssyria, wiki: 'https://en.wikipedia.org/wiki/Neo-Assyrian_Empire' },
  { id: 'neo-babylon', color: '#8b5a2b', name: N('Neo-Babylonian Empire', 'Neubabylonisches Reich', '新巴比伦帝国'), from: -626, to: -539, g: G.neoBabylon, wiki: 'https://en.wikipedia.org/wiki/Neo-Babylonian_Empire' },
  { id: 'phoenicia', color: '#2e8b7a', name: N('Phoenician cities', 'Phönizische Städte', '腓尼基城邦'), from: -1200, to: -333, g: G.phoenicia, wiki: 'https://en.wikipedia.org/wiki/Phoenicia' },

  // Indus / India
  { id: 'indus', color: '#2e8b7a', name: N('Indus Valley Civilization', 'Indus-Kultur', '印度河文明'), from: -3300, to: -1300, g: G.indus, wiki: 'https://en.wikipedia.org/wiki/Indus_Valley_Civilisation' },
  { id: 'maurya', color: '#2e8b7a', name: N('Maurya Empire', 'Maurya-Reich', '孔雀帝国'), from: -322, to: -185, g: G.maurya, wiki: 'https://en.wikipedia.org/wiki/Maurya_Empire' },
  { id: 'gupta', color: '#2e8b7a', name: N('Gupta Empire', 'Gupta-Reich', '笈多帝国'), from: 320, to: 550, g: G.gupta, wiki: 'https://en.wikipedia.org/wiki/Gupta_Empire' },
  { id: 'delhi', color: '#2e8b7a', name: N('Delhi Sultanate', 'Delhi-Sultanat', '德里苏丹国'), from: 1206, to: 1525, g: G.delhi, wiki: 'https://en.wikipedia.org/wiki/Delhi_Sultanate' },
  { id: 'mughal', color: '#228b22', name: N('Mughal Empire', 'Mogulreich', '莫卧儿帝国'), from: 1526, to: 1857, g: G.mughal, wiki: 'https://en.wikipedia.org/wiki/Mughal_Empire' },
  { id: 'british-india', color: '#4a6fa5', name: N('British India', 'Britisch-Indien', '英属印度'), from: 1757, to: 1947, g: G.britishIndia, wiki: 'https://en.wikipedia.org/wiki/British_Raj' },
  { id: 'india', color: '#2e8b7a', name: N('Republic of India', 'Republik Indien', '印度共和国'), from: 1947, to: 2100, g: G.modernIndia, wiki: 'https://en.wikipedia.org/wiki/India' },

  // China
  { id: 'liangzhu', color: '#2e8b7a', name: N('Liangzhu culture', 'Liangzhu-Kultur', '良渚文明'), from: -3300, to: -2300, g: G.liangzhu, wiki: 'https://en.wikipedia.org/wiki/Liangzhu_culture' },
  { id: 'longshan', color: '#c45c26', name: N('Longshan culture', 'Longshan-Kultur', '龙山文化'), from: -3000, to: -1900, g: G.longshan, wiki: 'https://en.wikipedia.org/wiki/Longshan_culture' },
  { id: 'erlitou', color: '#b87333', name: N('Erlitou culture', 'Erlitou-Kultur', '二里头文化'), from: -1900, to: -1500, g: G.erlitou, wiki: 'https://en.wikipedia.org/wiki/Erlitou_culture' },
  { id: 'sanxingdui', color: '#cd7f32', name: N('Sanxingdui culture', 'Sanxingdui-Kultur', '三星堆文明'), from: -1600, to: -1000, g: G.sanxingdui, wiki: 'https://en.wikipedia.org/wiki/Sanxingdui' },
  { id: 'shang', color: '#c45c26', name: N('Shang dynasty', 'Shang-Dynastie', '商朝'), from: -1600, to: -1046, g: G.shang, wiki: 'https://en.wikipedia.org/wiki/Shang_dynasty' },
  { id: 'zhou', color: '#c45c26', name: N('Zhou dynasty', 'Zhou-Dynastie', '周朝'), from: -1045, to: -771, g: G.westernZhou, wiki: 'https://en.wikipedia.org/wiki/Zhou_dynasty' },
  { id: 'eastern-zhou', color: '#c45c26', name: N('Eastern Zhou / Spring and Autumn', 'Östliche Zhou', '东周/春秋'), from: -770, to: -476, g: G.westernZhou, wiki: 'https://en.wikipedia.org/wiki/Eastern_Zhou' },
  { id: 'warring-states', color: '#c45c26', name: N('Warring States China', 'Zeit der Streitenden Reiche', '战国'), from: -475, to: -222, g: G.warringStates, wiki: 'https://en.wikipedia.org/wiki/Warring_States_period' },
  { id: 'qin', color: '#c45c26', name: N('Qin dynasty', 'Qin-Dynastie', '秦朝'), from: -221, to: -207, g: G.qin, wiki: 'https://en.wikipedia.org/wiki/Qin_dynasty' },
  { id: 'han', color: '#c45c26', name: N('Han dynasty', 'Han-Dynastie', '汉朝'), from: -206, to: 220, g: G.han, wiki: 'https://en.wikipedia.org/wiki/Han_dynasty' },
  { id: 'three-kingdoms', color: '#c45c26', name: N('Three Kingdoms China', 'Drei Reiche', '三国'), from: 220, to: 280, g: G.han, wiki: 'https://en.wikipedia.org/wiki/Three_Kingdoms' },
  { id: 'jin-sui', color: '#c45c26', name: N('Jin / Northern & Southern / Sui', 'Jin / Nord-Süd / Sui', '晋/南北朝/隋'), from: 281, to: 617, g: G.han, wiki: 'https://en.wikipedia.org/wiki/Sui_dynasty' },
  { id: 'tang', color: '#c45c26', name: N('Tang dynasty', 'Tang-Dynastie', '唐朝'), from: 618, to: 907, g: G.tang, wiki: 'https://en.wikipedia.org/wiki/Tang_dynasty' },
  { id: 'song', color: '#c45c26', name: N('Song dynasty', 'Song-Dynastie', '宋朝'), from: 960, to: 1126, g: G.song, wiki: 'https://en.wikipedia.org/wiki/Song_dynasty' },
  { id: 'south-song', color: '#c45c26', name: N('Southern Song', 'Südliche Song', '南宋'), from: 1127, to: 1279, g: G.southSong, wiki: 'https://en.wikipedia.org/wiki/Song_dynasty' },
  { id: 'yuan', color: '#8b0000', name: N('Yuan dynasty', 'Yuan-Dynastie', '元朝'), from: 1271, to: 1368, g: G.yuan, wiki: 'https://en.wikipedia.org/wiki/Yuan_dynasty' },
  { id: 'ming', color: '#c45c26', name: N('Ming dynasty', 'Ming-Dynastie', '明朝'), from: 1368, to: 1643, g: G.ming, wiki: 'https://en.wikipedia.org/wiki/Ming_dynasty' },
  { id: 'qing', color: '#c45c26', name: N('Qing dynasty', 'Qing-Dynastie', '清朝'), from: 1644, to: 1911, g: G.qing, wiki: 'https://en.wikipedia.org/wiki/Qing_dynasty' },
  { id: 'roc-prc', color: '#c45c26', name: N('China (ROC / PRC)', 'China (Republik / VR)', '中国（民国/中华人民共和国）'), from: 1912, to: 2100, g: G.prc, wiki: 'https://en.wikipedia.org/wiki/China' },

  // Aegean / Greece
  { id: 'cycladic', color: '#6b8cae', name: N('Cycladic culture', 'Kykladische Kultur', '基克拉迪文化'), from: -3200, to: -2000, g: G.cycladic, wiki: 'https://en.wikipedia.org/wiki/Cycladic_culture' },
  { id: 'minoan', color: '#4a6fa5', name: N('Minoan Crete', 'Minoisches Kreta', '米诺斯克里特'), from: -3000, to: -1450, g: G.minoan, wiki: 'https://en.wikipedia.org/wiki/Minoan_civilization' },
  { id: 'mycenae', color: '#4a6fa5', name: N('Mycenaean Greece', 'Mykenisches Griechenland', '迈锡尼希腊'), from: -1600, to: -1100, g: G.mycenae, wiki: 'https://en.wikipedia.org/wiki/Mycenaean_Greece' },
  { id: 'classical-greece', color: '#4a6fa5', name: N('Classical Greek world', 'Klassisches Griechenland', '古典希腊世界'), from: -500, to: -338, g: G.greece, wiki: 'https://en.wikipedia.org/wiki/Classical_Greece' },
  { id: 'macedon', color: '#4a6fa5', name: N('Kingdom of Macedon', 'Königreich Makedonien', '马其顿王国'), from: -359, to: -331, g: G.macedonia, wiki: 'https://en.wikipedia.org/wiki/Macedonia_(ancient_kingdom)' },
  { id: 'alexander', color: '#4169e1', name: N('Alexander’s empire (peak)', 'Alexanderreich (Höhepunkt)', '亚历山大帝国（极盛）'), from: -330, to: -323, g: G.alexander, wiki: 'https://en.wikipedia.org/wiki/Wars_of_Alexander_the_Great' },
  { id: 'macedon-late', color: '#4a6fa5', name: N('Antigonid Macedon', 'Antigonidisches Makedonien', '安提柯王朝马其顿'), from: -276, to: -168, g: G.macedonia, wiki: 'https://en.wikipedia.org/wiki/Antigonid_dynasty' },

  // Persia / Iran
  { id: 'achaemenid', color: '#b8860b', name: N('Achaemenid Empire', 'Achämenidenreich', '阿契美尼德帝国'), from: -550, to: -330, g: G.achaemenid, wiki: 'https://en.wikipedia.org/wiki/Achaemenid_Empire' },
  { id: 'seleucid', color: '#b8860b', name: N('Seleucid Empire', 'Seleukidenreich', '塞琉古帝国'), from: -312, to: -63, g: G.seleucidCore, wiki: 'https://en.wikipedia.org/wiki/Seleucid_Empire' },
  { id: 'parthia-early', color: '#b8860b', name: N('Parthia (Arsacid kingdom)', 'Parthien (Arsakiden)', '帕提亚（安息）'), from: -247, to: -142, g: rect(52, 35, 62, 40), wiki: 'https://en.wikipedia.org/wiki/Parthian_Empire' },
  { id: 'parthia', color: '#b8860b', name: N('Parthian Empire', 'Partherreich', '帕提亚帝国'), from: -141, to: 224, g: G.parthia, wiki: 'https://en.wikipedia.org/wiki/Parthian_Empire' },
  { id: 'sasanian', color: '#b8860b', name: N('Sasanian Empire', 'Sasanidenreich', '萨珊帝国'), from: 224, to: 651, g: G.sasanian, wiki: 'https://en.wikipedia.org/wiki/Sasanian_Empire' },
  { id: 'safavid', color: '#b8860b', name: N('Safavid Empire', 'Safawidenreich', '萨法维帝国'), from: 1501, to: 1736, g: G.safavid, wiki: 'https://en.wikipedia.org/wiki/Safavid_Iran' },
  { id: 'qajar', color: '#b8860b', name: N('Qajar Iran', 'Kadscharisches Iran', '卡扎尔伊朗'), from: 1789, to: 1925, g: G.qajar, wiki: 'https://en.wikipedia.org/wiki/Qajar_Iran' },
  { id: 'iran', color: '#b8860b', name: N('Iran', 'Iran', '伊朗'), from: 1925, to: 2100, g: G.modernIran, wiki: 'https://en.wikipedia.org/wiki/Iran' },

  // Rome / Byzantium
  { id: 'rome-early', color: '#8b0000', name: N('Roman Republic (Italy)', 'Römische Republik (Italien)', '罗马共和国（意大利）'), from: -509, to: -201, g: G.romanRepublicItaly, wiki: 'https://en.wikipedia.org/wiki/Roman_Republic' },
  { id: 'rome-west-med', color: '#8b0000', name: N('Roman Republic / West Mediterranean', 'Rom im westl. Mittelmeer', '罗马西地中海'), from: -200, to: -28, g: G.romanWest, wiki: 'https://en.wikipedia.org/wiki/Roman_Republic' },
  { id: 'roman-empire', color: '#8b0000', name: N('Roman Empire', 'Römisches Reich', '罗马帝国'), from: -27, to: 395, g: G.romanFull, wiki: 'https://en.wikipedia.org/wiki/Roman_Empire' },
  { id: 'wre', color: '#a52a2a', name: N('Western Roman Empire', 'Weströmisches Reich', '西罗马帝国'), from: 395, to: 476, g: G.romanWest, wiki: 'https://en.wikipedia.org/wiki/Western_Roman_Empire' },
  { id: 'byzantine', color: '#4a6fa5', name: N('Byzantine Empire', 'Byzantinisches Reich', '拜占庭帝国'), from: 395, to: 1203, g: G.byzantineEarly, wiki: 'https://en.wikipedia.org/wiki/Byzantine_Empire' },
  { id: 'byzantine-late', color: '#4a6fa5', name: N('Late Byzantine Empire', 'Spätbyzantinisches Reich', '晚期拜占庭'), from: 1261, to: 1453, g: G.byzantineLate, wiki: 'https://en.wikipedia.org/wiki/Byzantine_Empire' },

  // Islamic world
  { id: 'rashidun-umayyad', color: '#2e8b57', name: N('Rashidun / Umayyad Caliphate', 'Raschidun / Umayyaden', '正统/倭马亚哈里发'), from: 632, to: 749, g: G.umayyad, wiki: 'https://en.wikipedia.org/wiki/Umayyad_Caliphate' },
  { id: 'abbasid', color: '#2e8b57', name: N('Abbasid Caliphate', 'Abbasiden-Kalifat', '阿拔斯哈里发国'), from: 750, to: 1258, g: G.abbasid, wiki: 'https://en.wikipedia.org/wiki/Abbasid_Caliphate' },
  { id: 'fatimid', color: '#3cb371', name: N('Fatimid Caliphate', 'Fatimiden-Kalifat', '法蒂玛哈里发'), from: 909, to: 1171, g: G.fatimid, wiki: 'https://en.wikipedia.org/wiki/Fatimid_Caliphate' },
  { id: 'mamluk', color: '#2e8b57', name: N('Ayyubid / Mamluk Egypt', 'Ayyubiden / Mamluken', '阿尤布/马穆鲁克埃及'), from: 1171, to: 1516, g: G.ayyubidMamluk, wiki: 'https://en.wikipedia.org/wiki/Mamluk_Sultanate' },

  // Europe
  { id: 'carthage', color: '#8b4513', name: N('Carthaginian sphere', 'Karthagischer Raum', '迦太基势力'), from: -650, to: -146, g: G.carthage, wiki: 'https://en.wikipedia.org/wiki/Ancient_Carthage' },
  { id: 'carolingian', color: '#6b8e23', name: N('Carolingian Empire', 'Karolingerreich', '加洛林帝国'), from: 768, to: 843, g: G.carolingian, wiki: 'https://en.wikipedia.org/wiki/Carolingian_Empire' },
  { id: 'hre', color: '#6b8e23', name: N('Holy Roman Empire', 'Heiliges Römisches Reich', '神圣罗马帝国'), from: 962, to: 1806, g: G.hre, wiki: 'https://en.wikipedia.org/wiki/Holy_Roman_Empire' },
  { id: 'kievan', color: '#8b4513', name: N('Kievan Rus’', 'Kiewer Rus', '基辅罗斯'), from: 880, to: 1240, g: G.kievanRus, wiki: 'https://en.wikipedia.org/wiki/Kievan_Rus%27' },
  { id: 'france', color: '#4169e1', name: N('Kingdom of France', 'Königreich Frankreich', '法兰西王国'), from: 987, to: 1791, g: G.france, wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_France' },
  { id: 'napoleonic', color: '#4169e1', name: N('Napoleonic France', 'Napoleonisches Frankreich', '拿破仑法国'), from: 1799, to: 1815, g: G.napoleonicFrance, wiki: 'https://en.wikipedia.org/wiki/First_French_Empire' },
  { id: 'spain', color: '#d2691e', name: N('Spanish monarchy', 'Spanische Monarchie', '西班牙君主国'), from: 1479, to: 1808, g: G.spain, wiki: 'https://en.wikipedia.org/wiki/Spain' },
  { id: 'britain', color: '#4a6fa5', name: N('Britain / UK', 'Britannien / UK', '不列颠/英国'), from: 1707, to: 2100, g: G.britain, wiki: 'https://en.wikipedia.org/wiki/United_Kingdom' },
  { id: 'poland-lith', color: '#daa520', name: N('Polish–Lithuanian Commonwealth', 'Polen-Litauen', '波兰立陶宛联邦'), from: 1569, to: 1795, g: G.polandLith, wiki: 'https://en.wikipedia.org/wiki/Polish%E2%80%93Lithuanian_Commonwealth' },
  { id: 'austria', color: '#bc8f8f', name: N('Habsburg Austria', 'Habsburgisches Österreich', '哈布斯堡奥地利'), from: 1526, to: 1918, g: G.austriaHabs, wiki: 'https://en.wikipedia.org/wiki/Habsburg_monarchy' },
  { id: 'prussia', color: '#708090', name: N('Prussia / German Empire core', 'Preußen / Deutsches Kaiserreich', '普鲁士/德意志帝国核心'), from: 1701, to: 1918, g: G.prussia, wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Prussia' },
  { id: 'eu-core', color: '#6b8e23', name: N('European states (core)', 'Europäische Staaten (Kern)', '欧洲国家（核心）'), from: 1816, to: 2100, g: G.euCore, wiki: 'https://en.wikipedia.org/wiki/Europe' },

  // Steppe / Mongol / Russia
  { id: 'mongol', color: '#8b0000', name: N('Mongol Empire', 'Mongolenreich', '蒙古帝国'), from: 1206, to: 1260, g: G.mongolEmpire, wiki: 'https://en.wikipedia.org/wiki/Mongol_Empire' },
  { id: 'golden-horde', color: '#a52a2a', name: N('Golden Horde', 'Goldene Horde', '金帐汗国'), from: 1242, to: 1502, g: G.goldenHorde, wiki: 'https://en.wikipedia.org/wiki/Golden_Horde' },
  { id: 'ilkhanate', color: '#cd5c5c', name: N('Ilkhanate', 'Ilchanat', '伊儿汗国'), from: 1256, to: 1335, g: G.ilkhanate, wiki: 'https://en.wikipedia.org/wiki/Ilkhanate' },
  { id: 'timurid', color: '#cd853f', name: N('Timurid Empire', 'Timuridenreich', '帖木儿帝国'), from: 1370, to: 1507, g: G.timurid, wiki: 'https://en.wikipedia.org/wiki/Timurid_Empire' },
  { id: 'moscow', color: '#8b0000', name: N('Grand Duchy of Moscow', 'Großfürstentum Moskau', '莫斯科大公国'), from: 1283, to: 1546, g: G.moscow, wiki: 'https://en.wikipedia.org/wiki/Grand_Duchy_of_Moscow' },
  { id: 'russia-tsardom', color: '#8b0000', name: N('Tsardom of Russia', 'Zarentum Russland', '俄罗斯沙皇国'), from: 1547, to: 1720, g: G.moscow, wiki: 'https://en.wikipedia.org/wiki/Tsardom_of_Russia' },
  { id: 'russian-empire', color: '#8b0000', name: N('Russian Empire', 'Russisches Kaiserreich', '俄罗斯帝国'), from: 1721, to: 1917, g: G.russianEmpire, wiki: 'https://en.wikipedia.org/wiki/Russian_Empire' },
  { id: 'ussr', color: '#8b0000', name: N('Soviet Union', 'Sowjetunion', '苏联'), from: 1922, to: 1991, g: G.ussr, wiki: 'https://en.wikipedia.org/wiki/Soviet_Union' },
  { id: 'russia', color: '#8b0000', name: N('Russian Federation', 'Russische Föderation', '俄罗斯联邦'), from: 1992, to: 2100, g: G.modernRussia, wiki: 'https://en.wikipedia.org/wiki/Russia' },

  // Ottoman
  { id: 'ottoman-rise', color: '#2e8b57', name: N('Ottoman Beylik / early empire', 'Osmanisches Beylik', '奥斯曼早期'), from: 1299, to: 1452, g: G.ottomanRise, wiki: 'https://en.wikipedia.org/wiki/Ottoman_Empire' },
  { id: 'ottoman-peak', color: '#2e8b57', name: N('Ottoman Empire', 'Osmanisches Reich', '奥斯曼帝国'), from: 1453, to: 1799, g: G.ottomanPeak, wiki: 'https://en.wikipedia.org/wiki/Ottoman_Empire' },
  { id: 'ottoman-late', color: '#2e8b57', name: N('Late Ottoman Empire', 'Spätes Osmanisches Reich', '晚期奥斯曼帝国'), from: 1800, to: 1922, g: G.ottomanLate, wiki: 'https://en.wikipedia.org/wiki/Ottoman_Empire' },
  { id: 'turkey', color: '#2e8b57', name: N('Republic of Turkey', 'Republik Türkei', '土耳其共和国'), from: 1923, to: 2100, g: G.modernTurkey, wiki: 'https://en.wikipedia.org/wiki/Turkey' },

  // East Asia others
  { id: 'tibet-empire', color: '#8b6914', name: N('Tibetan Empire', 'Tibetisches Reich', '吐蕃'), from: 618, to: 842, g: G.tibetEmpire, wiki: 'https://en.wikipedia.org/wiki/Tibetan_Empire' },
  { id: 'silla', color: '#4a6fa5', name: N('Silla / Korean kingdoms', 'Silla / koreanische Reiche', '新罗/朝鲜半岛诸国'), from: 57, to: 935, g: G.silla, wiki: 'https://en.wikipedia.org/wiki/Silla' },
  { id: 'joseon', color: '#4a6fa5', name: N('Joseon Korea', 'Joseon-Korea', '朝鲜王朝'), from: 1392, to: 1897, g: G.joseon, wiki: 'https://en.wikipedia.org/wiki/Joseon' },
  { id: 'korea', color: '#4a6fa5', name: N('Korea', 'Korea', '朝鲜半岛'), from: 1948, to: 2100, g: G.koreaModern, wiki: 'https://en.wikipedia.org/wiki/Korea' },
  { id: 'yamato', color: '#dc143c', name: N('Yamato Japan', 'Yamato-Japan', '大和日本'), from: 250, to: 710, g: G.japanYamato, wiki: 'https://en.wikipedia.org/wiki/Yamato_period' },
  { id: 'japan-heian-edo', color: '#dc143c', name: N('Japan (Heian–Edo)', 'Japan (Heian–Edo)', '日本（平安–江户）'), from: 794, to: 1867, g: G.japanTokugawa, wiki: 'https://en.wikipedia.org/wiki/History_of_Japan' },
  { id: 'japan', color: '#dc143c', name: N('Japan', 'Japan', '日本'), from: 1868, to: 2100, g: G.modernJapan, wiki: 'https://en.wikipedia.org/wiki/Japan' },

  // Central Asia
  { id: 'kushan', color: '#6b4c9a', name: N('Kushan Empire', 'Kuschana-Reich', '贵霜帝国'), from: 30, to: 375, g: G.kushan, wiki: 'https://en.wikipedia.org/wiki/Kushan_Empire' },
]

function centuryYears() {
  const years = []
  const push = (y) => {
    if (y === 0) years.push(1)
    else years.push(y)
  }
  // 3700 BCE → 800 BCE: every 100 years
  for (let y = -3700; y <= -800; y += 100) push(y)
  // 800 BCE → 1492 CE: every 50 years (skip astronomical year 0 → use 1)
  for (let y = -800 + 50; y < 1492; y += 50) push(y)
  push(1492)
  // 1492 CE → 2026 CE: every 20 years
  for (let y = 1492 + 20; y < 2026; y += 20) push(y)
  push(2026)
  return [...new Set(years)]
}

function eventYears() {
  const events = JSON.parse(readFileSync(eventsPath, 'utf8'))
  const set = new Set()
  for (const e of events) {
    set.add(e.startYear)
    if (e.endYear !== e.startYear) set.add(e.endYear)
  }
  return [...set]
}

function allTargetYears() {
  const set = new Set([...centuryYears(), ...eventYears()])
  return [...set].sort((a, b) => a - b)
}

function politiesForYear(year) {
  return POLITIES.filter((p) => year >= p.from && year <= p.to).map((p) =>
    feature(p.id, p.color, p.name, p.g, p.wiki),
  )
}

function sourcesForYear(year, features) {
  const wikiLinks = [
    ...new Set(features.map((f) => f.properties.wiki).filter(Boolean)),
  ].slice(0, 8)
  return [
    {
      label: 'Wikipedia — historical period pages (see feature wiki URLs)',
      url: 'https://en.wikipedia.org/wiki/History_of_Eurasia',
    },
    ...wikiLinks.map((url) => ({
      label: url.replace('https://en.wikipedia.org/wiki/', 'Wikipedia: ').replace(/_/g, ' '),
      url,
    })),
    {
      label: `Snapshot year ${year} (variable grid + event years; approximate polygons)`,
      url: 'https://en.wikipedia.org/wiki/Historical_geography',
    },
  ]
}

// Remove old geojson files before writing
for (const name of readdirSync(terrDir)) {
  if (name.endsWith('.geojson') || name === 'manifest.json') {
    unlinkSync(join(terrDir, name))
  }
}

const years = allTargetYears()
const manifest = {
  intervalYears: {
    from3700to800BCE: 100,
    from800BCEto1492: 50,
    from1492to2026: 20,
  },
  note: 'Snapshots every 100 years from 3700–800 BCE, every 50 years from 800 BCE–1492 CE, every 20 years from 1492–2026 CE, plus years of curated events. Polygons are approximate educational outlines timed from Wikipedia period pages.',
  snapshots: years.map((year) => {
    const features = politiesForYear(year)
    const fc = {
      type: 'FeatureCollection',
      properties: { year },
      features,
    }
    writeFileSync(join(terrDir, `${year}.geojson`), JSON.stringify(fc))
    return {
      year,
      sources: sourcesForYear(year, features),
    }
  }),
}

writeFileSync(join(terrDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

const empty = years.filter((y) => politiesForYear(y).length === 0)
console.log(`Wrote ${years.length} territory snapshots to ${terrDir}`)
console.log(`Century grid + event years. Empty snapshots: ${empty.length}`)
if (empty.length) console.log('Empty years:', empty.join(', '))
