export interface StatisticsMaterial {
  id: string
  title: string
  language: 'zh' | 'en'
  text: string
}

export const STATISTICS_MATERIALS: StatisticsMaterial[] = [
  {
    id: 'zh-listening',
    title: '从呼吸到声音',
    language: 'zh',
    text: '开始练习时，我先让呼吸自然流动，再用轻松的声带振动发出一个舒适的音。音高上行时，声音应该保持连贯，不需要用力挤压喉咙；音高下行时，也不要突然失去支撑。说到一句话的重点，语气可以自然升高，句尾则慢慢回落。这样的练习不是追求一个固定数字，而是学会听见自己的变化，在清楚、稳定和放松之间找到平衡。',
  },
  {
    id: 'zh-conversation',
    title: '元音与共振',
    language: 'zh',
    text: '练习元音时，我先保持气流连续，再观察舌头、下颌和嘴唇怎样改变口腔的形状。舌位和开口度会影响第一共振峰，舌头的前后位置、圆唇以及声道长度会共同影响第二共振峰。把“啊、诶、衣、乌、鱼”慢慢连起来，可以听见音色怎样移动。共振峰是声音留下的结构线索，配合回听和图上的频率读数，能帮助我们把抽象的感觉变成可观察的变化。',
  },
  {
    id: 'en-listening',
    title: 'From Breath to Voice',
    language: 'en',
    text: 'When I begin a voice exercise, I let the breath move freely before I ask the vocal folds to vibrate. A gentle slide upward can make the pitch brighter, but it should stay easy and connected. On the way back down, I keep the sound supported instead of pressing the throat. A speaking voice needs movement: questions may rise, statements may settle, and emphasis can change the shape of a phrase. The goal is not one perfect number, but a clear and comfortable voice that remains flexible.',
  },
  {
    id: 'en-conversation',
    title: 'Vowels and Resonance',
    language: 'en',
    text: 'A vowel is shaped by the moving space above the vocal folds. The tongue, jaw, lips, and length of the vocal tract all change the resonances that color the sound. A more open mouth often changes F1, while tongue position, rounding, and tract length influence F2 together. Try moving slowly from “ah” to “ee” and then to “oo,” listening for the change in brightness. The chart gives those changes a visible trace, so hearing, movement, and frequency can be practiced as one connected skill.',
  },
]

