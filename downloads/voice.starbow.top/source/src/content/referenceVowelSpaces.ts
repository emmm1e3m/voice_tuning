export type ReferenceVowel = 'æ' | 'ʌ' | 'ɒ' | 'ɜː' | 'e' | 'ɪ' | 'iː' | 'ʊ' | 'u'
export type VowelSpaceCondition = 'masculinised' | 'neutral' | 'feminised'

export interface ReferenceVowelPoint {
  vowel: ReferenceVowel
  f1: number
  f2: number
  labelOffset: readonly [number, number]
}

export interface VowelSpaceTrace {
  condition: VowelSpaceCondition
  points: readonly ReferenceVowelPoint[]
  lineApex?: { f1: number; f2: number }
}

export interface ReferenceVowelSpace {
  title: string
  traces: readonly VowelSpaceTrace[]
}

export const VOWEL_SPACE_CONDITIONS = {
  masculinised: { label: '男性化', color: '#356f9b' },
  neutral: { label: '中性', color: '#6d9746' },
  feminised: { label: '女性化', color: '#c65e6b' },
} as const

export const VOWEL_SPACE_OUTLINE: readonly ReferenceVowel[] = ['u', 'ʊ', 'ɒ', 'ʌ', 'æ', 'e', 'ɪ', 'iː']

// 两图共用坐标尺度，便于直接比较点位与元音空间大小。
export const VOWEL_SPACE_AXES = {
  f1Range: [200, 1050],
  f2Range: [900, 2700],
  f1Ticks: [200, 300, 400, 500, 600, 700, 800, 900, 1000],
  f2Ticks: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600],
} as const

// 按原始 JPEG 的刻度和标记中心复描，坐标取到约 5 Hz；这些是图像估读值，不是原始测量数据。
// 原图使用 F2 向右、F1 向上的坐标；独立的 /ɜː/ 点不参与轮廓连线。
export const REFERENCE_VOWEL_SPACES: Readonly<Record<string, ReferenceVowelSpace>> = {
  'c95cf26bcdf3188881604011286d78e430b51295e55de32a56f362dda68d298e.jpg': {
    title: '男性元音空间',
    traces: [
      { condition: 'masculinised', points: [
        { vowel: 'u', f1: 350, f2: 1490, labelOffset: [-17, 3] },
        { vowel: 'ʊ', f1: 425, f2: 1415, labelOffset: [-17, 18] },
        { vowel: 'ɒ', f1: 465, f2: 1135, labelOffset: [-17, 3] },
        { vowel: 'ʌ', f1: 620, f2: 1405, labelOffset: [17, 14] },
        { vowel: 'æ', f1: 710, f2: 1480, labelOffset: [-18, -2] },
        { vowel: 'e', f1: 515, f2: 1745, labelOffset: [-17, 16] },
        { vowel: 'ɪ', f1: 420, f2: 1925, labelOffset: [-17, 13] },
        { vowel: 'iː', f1: 310, f2: 2135, labelOffset: [-17, 21] },
        { vowel: 'ɜː', f1: 490, f2: 1415, labelOffset: [-13, -18] },
      ] },
      { condition: 'neutral', points: [
        { vowel: 'u', f1: 320, f2: 1505, labelOffset: [-3, 29] },
        { vowel: 'ʊ', f1: 400, f2: 1450, labelOffset: [-10, 27] },
        { vowel: 'ɒ', f1: 510, f2: 1145, labelOffset: [-17, -10] },
        { vowel: 'ʌ', f1: 570, f2: 1285, labelOffset: [-17, -12] },
        { vowel: 'æ', f1: 735, f2: 1505, labelOffset: [-10, -24] },
        { vowel: 'e', f1: 545, f2: 1800, labelOffset: [17, -13] },
        { vowel: 'ɪ', f1: 435, f2: 1975, labelOffset: [15, -17] },
        { vowel: 'iː', f1: 315, f2: 2205, labelOffset: [-2, 30] },
        { vowel: 'ɜː', f1: 480, f2: 1430, labelOffset: [17, 16] },
      ] },
      { condition: 'feminised', points: [
        { vowel: 'u', f1: 385, f2: 1545, labelOffset: [17, -3] },
        { vowel: 'ʊ', f1: 405, f2: 1515, labelOffset: [17, -13] },
        { vowel: 'ɒ', f1: 535, f2: 1240, labelOffset: [-17, -16] },
        { vowel: 'ʌ', f1: 625, f2: 1390, labelOffset: [-17, -17] },
        { vowel: 'æ', f1: 750, f2: 1585, labelOffset: [17, -10] },
        { vowel: 'e', f1: 555, f2: 1795, labelOffset: [11, 31] },
        { vowel: 'ɪ', f1: 415, f2: 2025, labelOffset: [17, 3] },
        { vowel: 'iː', f1: 355, f2: 2235, labelOffset: [17, 5] },
        { vowel: 'ɜː', f1: 565, f2: 1475, labelOffset: [18, 3] },
      ] },
    ],
  },
  '01ee88cdf6e1652d9b384fdb1d6dc7e1c5212bb9813fd5736b198eb5041d29c8.jpg': {
    title: '女性元音空间',
    traces: [
      // 原图蓝色轮廓的顶部折点与 /æ/ 标记没有重合，保留两者各自的位置。
      { condition: 'masculinised', lineApex: { f1: 875, f2: 1740 }, points: [
        { vowel: 'u', f1: 400, f2: 1850, labelOffset: [-14, 23] },
        { vowel: 'ʊ', f1: 490, f2: 1740, labelOffset: [-17, 17] },
        { vowel: 'ɒ', f1: 590, f2: 1420, labelOffset: [-17, 6] },
        { vowel: 'ʌ', f1: 695, f2: 1535, labelOffset: [18, 3] },
        { vowel: 'æ', f1: 895, f2: 1725, labelOffset: [-19, -8] },
        { vowel: 'e', f1: 730, f2: 1980, labelOffset: [17, -17] },
        { vowel: 'ɪ', f1: 525, f2: 2210, labelOffset: [16, 24] },
        { vowel: 'iː', f1: 360, f2: 2305, labelOffset: [19, 0] },
        { vowel: 'ɜː', f1: 665, f2: 1655, labelOffset: [17, -18] },
      ] },
      { condition: 'neutral', lineApex: { f1: 945, f2: 1785 }, points: [
        { vowel: 'u', f1: 400, f2: 1980, labelOffset: [17, -16] },
        { vowel: 'ʊ', f1: 555, f2: 1855, labelOffset: [-4, 25] },
        { vowel: 'ɒ', f1: 635, f2: 1460, labelOffset: [-17, -8] },
        { vowel: 'ʌ', f1: 790, f2: 1595, labelOffset: [-18, -10] },
        { vowel: 'æ', f1: 960, f2: 1780, labelOffset: [-17, -19] },
        { vowel: 'e', f1: 775, f2: 2065, labelOffset: [17, -17] },
        { vowel: 'ɪ', f1: 570, f2: 2215, labelOffset: [17, 4] },
        { vowel: 'iː', f1: 385, f2: 2445, labelOffset: [17, 0] },
        { vowel: 'ɜː', f1: 755, f2: 1785, labelOffset: [-17, 0] },
      ] },
      { condition: 'feminised', points: [
        { vowel: 'u', f1: 450, f2: 2025, labelOffset: [17, -16] },
        { vowel: 'ʊ', f1: 550, f2: 1920, labelOffset: [17, -18] },
        { vowel: 'ɒ', f1: 710, f2: 1480, labelOffset: [-14, -17] },
        { vowel: 'ʌ', f1: 855, f2: 1685, labelOffset: [-17, -10] },
        { vowel: 'æ', f1: 965, f2: 1800, labelOffset: [18, -22] },
        { vowel: 'e', f1: 830, f2: 2185, labelOffset: [17, -19] },
        { vowel: 'ɪ', f1: 580, f2: 2355, labelOffset: [16, -17] },
        { vowel: 'iː', f1: 450, f2: 2525, labelOffset: [18, -13] },
        { vowel: 'ɜː', f1: 770, f2: 1860, labelOffset: [-17, -24] },
      ] },
    ],
  },
}
