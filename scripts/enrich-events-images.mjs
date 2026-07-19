/**
 * Adds 10 Europe + 10 China impactful events (close in time),
 * and attaches Wikimedia Commons / public images to all events.
 * Run: node scripts/enrich-events-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'public/data/events.json')

const W = {
  britannica: { label: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/' },
  wiki: (slug, label) => ({
    label: `Wikipedia — ${label}`,
    url: `https://en.wikipedia.org/wiki/${slug}`,
  }),
}

function commons(file, credit) {
  const encoded = encodeURIComponent(file.replace(/ /g, '_'))
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=800`,
    credit: credit || `Wikimedia Commons — ${file}`,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encoded}`,
  }
}

function L(name, location, consequence) {
  return { name, location, consequence }
}
function pt(lon, lat) {
  return { type: 'Point', coordinates: [lon, lat] }
}
function rect(w, s, e, n) {
  return {
    type: 'Polygon',
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  }
}
function ev(id, startYear, endYear, geometry, en, de, zh, sources, image) {
  return { id, startYear, endYear, geometry, i18n: { en, de, zh }, sources, image }
}

/** Specific Commons files for known events */
const IMAGE_BY_ID = {
  'uruk-urban': commons('Warka_Vase_(detail).jpg', 'Wikimedia Commons — Warka Vase'),
  cuneiform: commons('Sumerian_26th_c_Adab.jpg', 'Wikimedia Commons — Sumerian tablet'),
  'egypt-unification': commons('Narmer_Palette.jpg', 'Wikimedia Commons — Narmer Palette'),
  'indus-cities': commons('Mohenjo-daro.jpg', 'Wikimedia Commons — Mohenjo-daro'),
  'great-pyramid': commons('Kheops-Pyramid.jpg', 'Wikimedia Commons — Great Pyramid'),
  'akkadian-empire': commons('Sargon_of_Akkad.jpg', 'Wikimedia Commons — Sargon'),
  'minoan-palaces': commons('Knossos_-_North_Portico_02.jpg', 'Wikimedia Commons — Knossos'),
  hammurabi: commons('Code_of_Hammurabi.jpg', 'Wikimedia Commons — Code of Hammurabi'),
  olympics: commons('Olympia_stadium.jpg', 'Wikimedia Commons — Olympia'),
  'rome-founding': commons('She-wolf_suckles_Romulus_and_Remus.jpg', 'Wikimedia Commons — Capitoline Wolf'),
  confucius: commons('Confucius_Tang_Dynasty.jpg', 'Wikimedia Commons — Confucius'),
  'cyrus-persia': commons('Cyrus_II_le_Grand.jpg', 'Wikimedia Commons — Cyrus'),
  marathon: commons('Schlacht_bei_Marathon.png', 'Wikimedia Commons — Marathon'),
  alexander: commons('Alexander_the_Great_mosaic.jpg', 'Wikimedia Commons — Alexander mosaic'),
  ashoka: commons('Ashoka_Pillar_at_Vaishali,_Bihar,_India.jpg', 'Wikimedia Commons — Ashoka pillar'),
  'qin-unify': commons('Terracotta_Army,_View_of_Pit_1.jpg', 'Wikimedia Commons — Terracotta Army'),
  'han-founding': commons('Western_Han_painted_pottery_dancers.jpg', 'Wikimedia Commons — Western Han pottery'),
  'first-punic': commons('First_Punic_War.png', 'Wikimedia Commons — First Punic War map'),
  'second-punic': commons('Hannibal_Barca_bust_from_Capua.jpg', 'Wikimedia Commons — Hannibal'),
  'caesar-gaul': commons('Vercingetorix_throws_down_his_arms_at_the_feet_of_Julius_Caesar.jpg', 'Wikimedia Commons — Caesar & Vercingetorix'),
  'caesar-rubicon': commons('Julius_Caesar_and_the_Crossing_of_the_Rubicon.jpg', 'Wikimedia Commons — Rubicon'),
  'caesar-assassinated': commons('Death_of_Julius_Caesar_Vincenzo_Camuccini.jpg', 'Wikimedia Commons — Death of Caesar'),
  actium: commons('Battle_of_Actium.jpg', 'Wikimedia Commons — Actium'),
  'augustus-principate': commons('Statue-Augustus.jpg', 'Wikimedia Commons — Augustus of Prima Porta'),
  teutoburg: commons('Hermannsdenkmal.jpg', 'Wikimedia Commons — Hermannsdenkmal'),
  pompeii: commons('Pompeii_-_Forum_and_Vesuvius_-_old_photo.jpg', 'Wikimedia Commons — Pompeii & Vesuvius'),
  'trajan-peak': commons('Trajan\'s_Column_reliefs_-_Detail.jpg', 'Wikimedia Commons — Trajan’s Column'),
  constantine: commons('Head_of_Constantine\'s_colossal_statue_at_Capitoline_Museums.jpg', 'Wikimedia Commons — Constantine'),
  'constantinople-found': commons('Constantinople_aerial_view_illustration.jpg', 'Wikimedia Commons — Constantinople'),
  'fall-west-rome': commons('Romulus_Augustulus_and_Odoacer.jpg', 'Wikimedia Commons — Romulus Augustulus'),
  'paper-cai-lun': commons('Cai_Lun.jpg', 'Wikimedia Commons — Cai Lun'),
  'yellow-turban': commons('Yellow_Turban_Rebellion.jpg', 'Wikimedia Commons — Yellow Turban art'),
  'battle-red-cliffs': commons('Battle_of_Red_Cliffs.jpg', 'Wikimedia Commons — Red Cliffs'),
  genghis: commons('YuanEmperorAlbumGenghisPortrait.jpg', 'Wikimedia Commons — Genghis Khan'),
  'marco-polo': commons('Marco_Polo_travelling.jpg', 'Wikimedia Commons — Marco Polo'),
  'black-death': commons('Danse_macabre_by_Michael_Wolgemut.png', 'Wikimedia Commons — Danse macabre'),
  'ming-found': commons('Hongwu_Emperor.jpg', 'Wikimedia Commons — Hongwu Emperor'),
  'constantinople-1453': commons('Siege_of_Constantinople_1453_map.png', 'Wikimedia Commons — 1453 siege map'),
  gutenburg: commons('Gutenberg_Bible_British_Library_2.jpg', 'Wikimedia Commons — Gutenberg Bible'),
  columbus: commons('Landing_of_Columbus_(2).jpg', 'Wikimedia Commons — Landing of Columbus'),
  'qing-1644': commons('The_Shunzhi_Emperor.jpg', 'Wikimedia Commons — Shunzhi Emperor'),
  'thirty-years': commons('Defenestration-prague-1618.jpg', 'Wikimedia Commons — Defenestration of Prague'),
  'french-revolution': commons('Prise_de_la_Bastille.jpg', 'Wikimedia Commons — Storming of the Bastille'),
  napoleon: commons('Napoleon_in_His_Study.jpg', 'Wikimedia Commons — Napoleon'),
  'opium-war': commons('The_East_India_Company_iron_steam_ship_Nemesis.jpg', 'Wikimedia Commons — Nemesis steamer'),
  meiji: commons('Emperor_Meiji_in_1873.jpg', 'Wikimedia Commons — Emperor Meiji'),
  ww1: commons('British_106_Battery_RFA_Battle_of_the_Somme_1916.jpg', 'Wikimedia Commons — WWI'),
  ww2: commons('Into_the_Jaws_of_Death_23-0455M_edit.jpg', 'Wikimedia Commons — D-Day'),
  'prc-1949': commons('1949_Chinese_Stamp_of_Mao_and_Zhu_at_the_Gate_of_Heavenly_Peace.jpg', 'Wikimedia Commons — 1949 stamp'),
  'silk-road': commons('Silk_route.jpg', 'Wikimedia Commons — Silk Road map'),
  charlemagne: commons('Charlemagne_and_Pope_Adrian_I.jpg', 'Wikimedia Commons — Charlemagne'),
  'industrial-start': commons('Watt_steam_engine_in_action.gif', 'Wikimedia Commons — Watt engine'),
  'american-indep': commons('Declaration_independence.jpg', 'Wikimedia Commons — Declaration of Independence'),
  'rome-republic-start': commons('SPQR_inscription.jpg', 'Wikimedia Commons — SPQR'),
  'twelve-tables': commons('Twelve_Tables.jpg', 'Wikimedia Commons — Twelve Tables'),
  'wudi-han': commons('Emperor_Wu_of_Han.jpg', 'Wikimedia Commons — Emperor Wu'),
  'zhang-qian': commons('Zhang_Qian_taking_leave_from_emperor_Han_Wudi.jpg', 'Wikimedia Commons — Zhang Qian'),
  luther: commons('Luther95theses.jpg', 'Wikimedia Commons — 95 Theses door'),
  'spanish-armada': commons('Spanish_Armada.jpg', 'Wikimedia Commons — Spanish Armada'),
  westphalia: commons('Westfaelischer_Friede_in_Muenster_(Gerard_Terborch_1648).jpg', 'Wikimedia Commons — Peace of Westphalia'),
  'battle-vienna-1683': commons('Battle_of_Vienna_1683.jpg', 'Wikimedia Commons — Battle of Vienna'),
  'seven-years-war': commons('Battle_of_Kunersdorf_1759.jpg', 'Wikimedia Commons — Seven Years’ War'),
  'congress-vienna': commons('Congress_of_Vienna.jpg', 'Wikimedia Commons — Congress of Vienna'),
  'revolutions-1848': commons('Lamartine_1848.jpg', 'Wikimedia Commons — 1848 Revolution'),
  'german-empire-1871': commons('Werner_Proklamation_zum_Deutschen_Kaiserreich.jpg', 'Wikimedia Commons — Kaiser proclamation'),
  'berlin-wall-1989': commons('Thefalloftheberlinwall1989.JPG', 'Wikimedia Commons — Fall of Berlin Wall'),
  'tumu-crisis': commons('Ming_China_c1409.jpg', 'Wikimedia Commons — Ming China map'),
  'portuguese-ming-1517': commons('Portuguese_carracks_off_a_rocky_coast.jpg', 'Wikimedia Commons — Portuguese ships'),
  'macau-1557': commons('View_of_Macao_from_Penha.jpg', 'Wikimedia Commons — Macao'),
  'nurhaci-1618': commons('Nurhaci.jpg', 'Wikimedia Commons — Nurhaci'),
  'qing-taiwan-1683': commons('Formosa_Island_and_the_Pescadores.jpg', 'Wikimedia Commons — Formosa map'),
  'canton-system-1757': commons('View_of_Canton.jpg', 'Wikimedia Commons — Canton'),
  'macartney-1793': commons('Reception_of_the_Diplomatique_and_his_Suite_at_the_Court_of_Pekin.jpg', 'Wikimedia Commons — Macartney Embassy'),
  'taiping-1850': commons('Taiping_Rebellion.jpg', 'Wikimedia Commons — Taiping Rebellion'),
  'sino-japanese-1895': commons('Treaty_of_Shimonoseki.jpg', 'Wikimedia Commons — Treaty of Shimonoseki'),
  'may-fourth-1919': commons('May_Fourth_Movement.jpg', 'Wikimedia Commons — May Fourth'),
  'zheng-he': commons('ZhengHeShips.gif', 'Wikimedia Commons — Zheng He ships'),
}

const THEME_DEFAULTS = [
  commons('Roman_Empire_Trajan_117AD.png', 'Wikimedia Commons — Roman Empire map'),
  commons('Han_Empire_100_CE.png', 'Wikimedia Commons — Han Empire map'),
  commons('BlankMap-World6.svg', 'Wikimedia Commons — World map'),
  commons('Ancient_Orient.png', 'Wikimedia Commons — Ancient Near East'),
]

function pickImage(event) {
  if (IMAGE_BY_ID[event.id]) return IMAGE_BY_ID[event.id]
  const n = Math.abs(hash(event.id)) % THEME_DEFAULTS.length
  // Prefer thematic by region keywords
  const blob = JSON.stringify(event.i18n.en).toLowerCase()
  if (/rome|roman|caesar|augustus|italy|gaul|carthage/.test(blob)) {
    return commons('Roman_Empire_Trajan_117AD.png', 'Wikimedia Commons — Roman Empire map')
  }
  if (/china|han|qin|ming|qing|tang|song|beijing|chang/.test(blob)) {
    return commons('Han_Empire_100_CE.png', 'Wikimedia Commons — Han Empire map')
  }
  if (/persia|iran|silk/.test(blob)) {
    return commons('Achaemenid_Empire_500_BC.png', 'Wikimedia Commons — Achaemenid map')
  }
  return THEME_DEFAULTS[n]
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

const NEW_EVENTS = [
  // --- 10 Europe ---
  ev('luther', 1517, 1517, pt(12.1, 51.0),
    L('Luther’s Ninety-five Theses', 'Wittenberg, Germany', 'A protest over church practices spreads fast in print and splits Western Christianity.'),
    L('Luthers 95 Thesen', 'Wittenberg, Deutschland', 'Ein Protest über Kirchenpraxis verbreitet sich durch Druck und spaltet das westliche Christentum.'),
    L('路德《九十五条论纲》', '德国维滕贝格', '对教会做法的抗议借印刷迅速传播，西欧基督教走向分裂。'),
    [W.wiki('Ninety-five_Theses', 'Ninety-five Theses'), W.britannica],
    IMAGE_BY_ID.luther),
  ev('spanish-armada', 1588, 1588, rect(-10, 48, 2, 55),
    L('Spanish Armada campaign', 'English Channel', 'Spain’s huge fleet fails against England — sea power shifts in western Europe.'),
    L('Spanische Armada', 'Ärmelkanal', 'Spaniens große Flotte scheitert an England — Seemacht verschiebt sich.'),
    L('西班牙无敌舰队', '英吉利海峡', '西班牙大舰队远征失败，西欧海权格局改变。'),
    [W.wiki('Spanish_Armada', 'Spanish Armada'), W.britannica],
    IMAGE_BY_ID['spanish-armada']),
  ev('westphalia', 1648, 1648, pt(7.63, 51.96),
    L('Peace of Westphalia', 'Münster & Osnabrück', 'Treaties end the Thirty Years’ War and strengthen the idea of sovereign states.'),
    L('Westfälischer Friede', 'Münster & Osnabrück', 'Verträge beenden den Dreißigjährigen Krieg und stärken souveräne Staaten.'),
    L('威斯特伐利亚和约', '明斯特与奥斯纳布吕克', '结束三十年战争，强化主权国家观念。'),
    [W.wiki('Peace_of_Westphalia', 'Peace of Westphalia'), W.britannica],
    IMAGE_BY_ID.westphalia),
  ev('battle-vienna-1683', 1683, 1683, pt(16.37, 48.21),
    L('Battle of Vienna', 'Vienna, Austria', 'A coalition stops the Ottoman siege — a turning point for Central Europe.'),
    L('Schlacht am Kahlenberg', 'Wien, Österreich', 'Eine Koalition stoppt die osmanische Belagerung — Wendepunkt für Mitteleuropa.'),
    L('维也纳之战', '奥地利维也纳', '联军解除奥斯曼围城——中欧格局转折。'),
    [W.wiki('Battle_of_Vienna', 'Battle of Vienna'), W.britannica],
    IMAGE_BY_ID['battle-vienna-1683']),
  ev('seven-years-war', 1756, 1763, rect(-10, 35, 30, 55),
    L('Seven Years’ War', 'Europe & overseas empires', 'A global war reshapes colonies and great-power ranks — sometimes called a first world war.'),
    L('Siebenjähriger Krieg', 'Europa & Überseeimperien', 'Ein globaler Krieg formt Kolonien und Großmächte neu.'),
    L('七年战争', '欧洲与海外帝国', '全球性战争重塑殖民地与列强格局，常被视为“第一次世界大战”雏形。'),
    [W.wiki('Seven_Years%27_War', 'Seven Years’ War'), W.britannica],
    IMAGE_BY_ID['seven-years-war']),
  ev('congress-vienna', 1815, 1815, pt(16.37, 48.21),
    L('Congress of Vienna', 'Vienna', 'After Napoleon, powers redraw Europe’s map and try to keep a balance of power.'),
    L('Wiener Kongress', 'Wien', 'Nach Napoleon zeichnen Mächte Europas Karte neu und suchen Machtgleichgewicht.'),
    L('维也纳会议', '维也纳', '拿破仑战后列强重划欧洲地图，试图维持均势。'),
    [W.wiki('Congress_of_Vienna', 'Congress of Vienna'), W.britannica],
    IMAGE_BY_ID['congress-vienna']),
  ev('revolutions-1848', 1848, 1849, rect(-5, 40, 25, 55),
    L('Revolutions of 1848', 'Many European cities', 'People demand constitutions and nations — even when crushed, ideas keep spreading.'),
    L('Revolutionen 1848', 'Viele europäische Städte', 'Menschen fordern Verfassungen und Nationen — Ideen wirken weiter.'),
    L('1848年欧洲革命', '欧洲多城', '民众要求宪法与民族国家——虽遭镇压，思想继续传播。'),
    [W.wiki('Revolutions_of_1848', 'Revolutions of 1848'), W.britannica],
    IMAGE_BY_ID['revolutions-1848']),
  ev('german-empire-1871', 1871, 1871, pt(2.35, 48.86),
    L('German Empire proclaimed', 'Versailles, France', 'German states unite under Prussia — a new great power sits in the middle of Europe.'),
    L('Deutsches Kaiserreich ausgerufen', 'Versailles, Frankreich', 'Deutsche Staaten einigen sich unter Preußen — eine neue Großmacht.'),
    L('德意志帝国宣告成立', '法国凡尔赛', '德意志各邦在普鲁士主导下统一——欧洲中部出现新列强。'),
    [W.wiki('German_Empire', 'German Empire'), W.britannica],
    IMAGE_BY_ID['german-empire-1871']),
  ev('versailles-1919', 1919, 1919, pt(2.12, 48.8),
    L('Treaty of Versailles', 'Versailles, France', 'WWI peace terms reshape borders and anger — helping set the stage for later conflict.'),
    L('Versailler Vertrag', 'Versailles, Frankreich', 'Friedensbedingungen formen Grenzen und Unmut — und spätere Konflikte mit.'),
    L('凡尔赛条约', '法国凡尔赛', '一战和约重划边界并埋下怨恨，影响后来冲突。'),
    [W.wiki('Treaty_of_Versailles', 'Treaty of Versailles'), W.britannica],
    commons('Treaty_of_Versailles_signatures.jpg', 'Wikimedia Commons — Versailles')),
  ev('berlin-wall-1989', 1989, 1989, pt(13.4, 52.52),
    L('Fall of the Berlin Wall', 'Berlin, Germany', 'The Cold War barrier opens — a symbol that Eastern Europe’s communist order is ending.'),
    L('Fall der Berliner Mauer', 'Berlin, Deutschland', 'Die Kalter-Krieg-Grenze öffnet sich — Symbol für das Ende der kommunistischen Ordnung.'),
    L('柏林墙倒塌', '德国柏林', '冷战壁垒开放——象征东欧冷战秩序走向终结。'),
    [W.wiki('Fall_of_the_Berlin_Wall', 'Fall of the Berlin Wall'), W.britannica],
    IMAGE_BY_ID['berlin-wall-1989']),

  // --- 10 China (close in time to Europe counterparts) ---
  ev('tumu-crisis', 1449, 1449, pt(114.5, 41.0),
    L('Tumu Crisis', 'Northern Ming frontier', 'The Ming emperor is captured by Mongols — a shock that weakens Ming confidence.'),
    L('Tumu-Krise', 'Nördliche Ming-Grenze', 'Der Ming-Kaiser wird von Mongolen gefangen — ein Schock für die Dynastie.'),
    L('土木之变', '明朝北边', '明英宗被俘——沉重打击明朝自信与边防。'),
    [W.wiki('Tumu_Crisis', 'Tumu Crisis'), W.britannica],
    IMAGE_BY_ID['tumu-crisis']),
  ev('portuguese-ming-1517', 1517, 1517, pt(113.5, 23.1),
    L('Portuguese reach Ming China', 'Pearl River Delta', 'European ships arrive seeking trade — the start of lasting maritime contact.'),
    L('Portugiesen erreichen Ming-China', 'Perlflussdelta', 'Europäische Schiffe suchen Handel — Beginn dauernder Seekontakte.'),
    L('葡萄牙人抵达明朝中国', '珠江口', '欧洲船只前来求贸——持久海上交往由此开始。'),
    [W.wiki('Portugal%E2%80%93China_relations', 'Portugal–China relations'), W.britannica],
    IMAGE_BY_ID['portuguese-ming-1517']),
  ev('macau-1557', 1557, 1557, pt(113.54, 22.19),
    L('Macau leased to Portugal', 'Macau', 'A European trading post settles on China’s coast for centuries.'),
    L('Macau an Portugal verpachtet', 'Macau', 'Ein europäischer Handelsposten bleibt jahrhundertelang an Chinas Küste.'),
    L('澳门租借给葡萄牙', '澳门', '欧洲贸易据点在中国沿海延续数百年。'),
    [W.wiki('History_of_Macau', 'History of Macau'), W.britannica],
    IMAGE_BY_ID['macau-1557']),
  ev('nurhaci-1618', 1618, 1618, pt(123.4, 41.8),
    L('Nurhaci’s Seven Grievances', 'Manchuria', 'Jurchen/Manchu resistance against Ming grows into a force that later conquers China.'),
    L('Nurhacis Sieben Beschwerden', 'Mandschurei', 'Jurchen/Mandschu-Widerstand gegen Ming wird zur Kraft, die später China erobert.'),
    L('努尔哈赤七大恨', '满洲', '女真/满洲反明力量壮大，日后入主中原。'),
    [W.wiki('Seven_Grievances', 'Seven Grievances'), W.britannica],
    IMAGE_BY_ID['nurhaci-1618']),
  ev('qing-taiwan-1683', 1683, 1683, pt(120.5, 23.5),
    L('Qing takes Taiwan', 'Taiwan', 'The Qing defeat the Kingdom of Tungning and bring the island under Qing rule.'),
    L('Qing erobert Taiwan', 'Taiwan', 'Die Qing besiegen das Königreich Tungning und bringen die Insel unter Qing-Herrschaft.'),
    L('清朝收台湾', '台湾', '清军击败明郑，台湾纳入清朝版图。'),
    [W.wiki('Kingdom_of_Tungning', 'Kingdom of Tungning'), W.britannica],
    IMAGE_BY_ID['qing-taiwan-1683']),
  ev('canton-system-1757', 1757, 1757, pt(113.26, 23.13),
    L('Canton System tightened', 'Guangzhou (Canton)', 'Qing limits European trade to Canton — shaping later conflicts over open ports.'),
    L('Kanton-System verschärft', 'Guangzhou (Kanton)', 'Qing begrenzt Europahandel auf Kanton — prägt spätere Hafenkonflikte.'),
    L('一口通商（广州）收紧', '广州', '清朝限制对欧贸易于广州——影响后来通商口岸冲突。'),
    [W.wiki('Canton_System', 'Canton System'), W.britannica],
    IMAGE_BY_ID['canton-system-1757']),
  ev('macartney-1793', 1793, 1793, pt(116.4, 39.9),
    L('Macartney Embassy', 'Beijing', 'Britain asks for freer trade; Qing refuses — a famous clash of worldviews.'),
    L('Macartney-Gesandtschaft', 'Beijing', 'Britannien will freieren Handel; Qing lehnt ab — berühmter Weltbild-Konflikt.'),
    L('马戛尔尼使团', '北京', '英使求扩大通商，清廷拒绝——著名的文明观念碰撞。'),
    [W.wiki('Macartney_Embassy', 'Macartney Embassy'), W.britannica],
    IMAGE_BY_ID['macartney-1793']),
  ev('taiping-1850', 1850, 1864, rect(110, 25, 122, 35),
    L('Taiping Rebellion begins', 'Southern China', 'A massive civil war kills millions and shakes the Qing state.'),
    L('Beginn des Taiping-Aufstands', 'Südchina', 'Ein riesiger Bürgerkrieg kostet Millionen und erschüttert die Qing.'),
    L('太平天国起事', '中国南方', '大规模内战死亡数百万，严重动摇清朝统治。'),
    [W.wiki('Taiping_Rebellion', 'Taiping Rebellion'), W.britannica],
    IMAGE_BY_ID['taiping-1850']),
  ev('sino-japanese-1895', 1895, 1895, pt(130.9, 33.96),
    L('Treaty of Shimonoseki', 'Shimonoseki, Japan', 'Qing loses to Japan and cedes Taiwan — East Asia’s power balance shifts.'),
    L('Vertrag von Shimonoseki', 'Shimonoseki, Japan', 'Qing unterliegt Japan und tritt Taiwan ab — Machtbalance in Ostasien ändert sich.'),
    L('马关条约', '日本下关', '清朝战败割让台湾——东亚力量对比剧变。'),
    [W.wiki('Treaty_of_Shimonoseki', 'Treaty of Shimonoseki'), W.britannica],
    IMAGE_BY_ID['sino-japanese-1895']),
  ev('may-fourth-1919', 1919, 1919, pt(116.4, 39.9),
    L('May Fourth Movement', 'Beijing & Chinese cities', 'Students protest the Versailles deal on Shandong — a spark for modern Chinese politics and culture.'),
    L('Bewegung des 4. Mai', 'Beijing & chinesische Städte', 'Studenten protestieren gegen Versailles wegen Shandong — Impuls für moderne Politik und Kultur.'),
    L('五四运动', '北京与中国多城', '学生抗议凡尔赛山东条款——推动中国近现代政治与文化变革。'),
    [W.wiki('May_Fourth_Movement', 'May Fourth Movement'), W.britannica],
    IMAGE_BY_ID['may-fourth-1919']),
]

const existing = JSON.parse(readFileSync(path, 'utf8'))
const byId = new Map(existing.map((e) => [e.id, e]))

let added = 0
for (const e of NEW_EVENTS) {
  if (!byId.has(e.id)) added++
  byId.set(e.id, e)
}

const merged = [...byId.values()].map((e) => ({
  ...e,
  image: e.image ?? pickImage(e),
})).sort((a, b) => a.startYear - b.startYear || a.id.localeCompare(b.id))

writeFileSync(path, JSON.stringify(merged, null, 2) + '\n')
console.log(`Events: ${merged.length} (added ${added} new). All have image fields.`)
