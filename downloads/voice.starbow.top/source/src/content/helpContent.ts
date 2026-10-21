import { F0_CHART_RANGE, FORMANT_CHART_RANGE } from '../config/analysisRanges'
import { TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { VOWEL_PRESETS, presetShortLabel, DEFAULT_CONFIG, type AppConfig } from '../types'
import { MANUAL_LESSONS, type ReviewQuestion } from './manualLessons'
import type { AnatomyFocus } from '../components/AnatomyExplorer'

export type HelpTopic = 'foreword' | 'quick-start' | 'anatomy' | 'source-filter' | 'perception' | 'f0' | 'f2' | 'f1' | 'practice-guide' | 'charts' | 'targets' | 'audio' | 'troubleshooting' | 'pitch-reference' | 'praat' | 'extra'
export type HelpLayout = 'portrait' | 'landscape'
export interface HelpSection {
  title: string
  paragraphs: readonly string[]
  steps?: readonly string[]
  html?: string
  imagePaths?: readonly string[]
  anatomyFocus?: AnatomyFocus
  collapsed?: boolean
  questions?: readonly ReviewQuestion[]
  visualization?: 'source-filter' | 'vowel-map' | 'chart-reading'
}
type HelpConfig = Pick<AppConfig, 'audioRetentionSeconds' | 'formantSmoothingWindow'>
export const HELP_TOPIC_ORDER: readonly HelpTopic[] = ['foreword', 'quick-start', 'anatomy', 'source-filter', 'perception', 'f0', 'f2', 'f1', 'practice-guide', 'charts', 'targets', 'audio', 'pitch-reference', 'extra', 'praat', 'troubleshooting']
export const LEARNING_TOPIC_ORDER: readonly HelpTopic[] = ['foreword', 'quick-start', 'anatomy', 'source-filter', 'perception', 'f0', 'f2', 'f1', 'practice-guide', 'extra']
export const HELP_TOPIC_GROUPS: readonly { label: string; topics: readonly HelpTopic[] }[] = [
  { label: '从这里开始', topics: ['foreword', 'quick-start'] },
  { label: '理解声音', topics: ['anatomy', 'source-filter', 'perception'] },
  { label: '实际练习', topics: ['f0', 'f2', 'f1', 'practice-guide'] },
  { label: '工具查阅', topics: ['charts', 'targets', 'audio', 'pitch-reference'] },
  { label: '进阶与排错', topics: ['extra', 'praat', 'troubleshooting'] },
]
const TITLES: Record<HelpTopic, string> = {
  foreword: '写在前面', 'quick-start': '快速上手', anatomy: '发声部位与动作', 'source-filter': '先理解声音', perception: '元音与性别感知',
  f0: 'F0 · 音高', f2: 'F2 · 共振与元音', f1: 'F1 · 开口与元音', 'practice-guide': '组合练习',
  charts: '读图与反馈', targets: '训练目标', audio: '录音与导入', 'pitch-reference': '音高参考',
  extra: '气流、语调与音色', praat: '用 Praat 深入分析', troubleshooting: '遇到问题',
}
export function getHelpTopicTitle(topic: HelpTopic): string { return TITLES[topic] }
export const HELP_TOPIC_INTROS: Partial<Record<HelpTopic, string>> = {}
const manual = (...ids: (string | number)[]): HelpSection[] => ids.map(id => ({ ...MANUAL_LESSONS[String(id)] }))

export function getQuickStartSteps(layout: HelpLayout, config: HelpConfig = DEFAULT_CONFIG) {
  return [
    { title: '录下第一句声音', description: layout === 'portrait'
      ? '点击底部麦克风按钮开始录音；首次使用时，按浏览器提示允许麦克风权限。先自然地说一句「今天的天气很好」，再点击同一按钮停止。'
      : '点击顶栏「开始录音」；首次使用时，按浏览器提示允许麦克风权限。先自然地说一句「今天的天气很好」，再点击「停止录音」。' },
    { title: '回放，再看三条曲线', description: `点击「回放」，先听自己的声音。图中 F0 紫、F1 粉、F2 蓝，曲线和目标区域保持同色：F0 对应声音高低，F1、F2 帮助观察元音和共振。上方三个数值概括当前保留窗口；侧边或底部反馈跟随最新声音。` },
    { title: '选择目标，开始一次短练习', description: `${layout === 'portrait' ? '点击底部「当前目标」' : '在左侧「本次练习 · 目标中心」'}先选 a，设置舒适的 F0；「按元音推荐」会填入该元音的 F1、F2 参考区间，也可切到「手动」调整。数字输入失焦或按 Enter 生效，滑杆实时生效。先短发一个 a（啊），停止并回放；接着点击 F0 的帮助图标学习怎样调整。当前保留最近 ${config.audioRetentionSeconds} 秒，可在「配置 → 保留时长」修改。` },
  ] as const
}
export function getPresetRows() {
  return Object.entries(VOWEL_PRESETS).map(([key, preset]) => ({ vowel: presetShortLabel(key), ranges: [preset.f0, preset.f1, preset.f2] }))
}

export function getHelpSections(topic: HelpTopic, layout: HelpLayout, config: HelpConfig = DEFAULT_CONFIG): readonly HelpSection[] {
  const targetsEntry = layout === 'portrait' ? '底部「当前目标」' : '左侧「本次练习 · 目标中心」'
  const importEntry = layout === 'portrait' ? '右上角「更多 → 导入音频」' : '顶栏「导入音频」'
  const downloadEntry = layout === 'portrait' ? '右上角「更多 → 下载 WAV」' : '顶栏「下载 WAV」'
  const sections = getQuickStartSteps(layout, config).map(step => ({ title: step.title, paragraphs: [step.description] }))
  switch (topic) {
    case 'foreword': return manual(3, 4)
    case 'quick-start': return [
      ...sections,
      { title: '接下来怎样读、怎样练', paragraphs: ['第一次接触时，按「发声部位与动作 → 先理解声音 → 元音与性别感知」建立基本概念，再依次练 F0、F2、F1。练习中忘记哪个部位或图上哪条线，随时用目录回到对应章节。'], steps: ['认识声带、舌、下颌和嘴唇，在交互图里试着移动它们。', '分清声带产生的音高，与声道塑造的元音音色。', '每次选一项短练，录音、回放、观察；再把它带进词语和日常说话。'] },
    ]
    case 'anatomy': return [
      { title: '先在图里找到部位', paragraphs: ['气流从肺部经过气管，在声带处形成有声振动，再经过咽腔、口腔从嘴唇辐射出来。先调图中的部位，随后对照下面的结构图与肌肉说明。'], anatomyFocus: 'all' },
      ...manual(7, 8, 9, 10, 11, 12, 13, 14, 15),
    ]
    case 'source-filter': return manual(17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28).map((section, index) => index === 0 ? { ...section, visualization: 'source-filter' } : section)
    case 'perception': return manual(30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40).map((section, index) => index === 4 ? { ...section, visualization: 'vowel-map' } : section)
    case 'f0': return [
      { ...manual(43)[0], anatomyFocus: 'f0' },
      { title: '开始前：选 a，录一段自然声音', paragraphs: [`在${targetsEntry}选择 a，先用平常的声音发 a（啊），再说一句短话。听回放、看紫色 F0 曲线，把这个位置作为比较的起点。`] },
      ...manual(44, 45),
      { title: '把音高放进目标中心', paragraphs: [`找到喜欢且容易重复的音高后，调整 F0 中心；图中会显示中心上下各 ${TARGET_HALF_WIDTH_HZ.f0} Hz 的紫色窗口。说话中的升降会超出窗口的一部分，先观察稳定发声和整句话的走势。`, '突然跳到约两倍或一半时，回放核对是否真的换了发声方式。停顿和清辅音没有稳定 F0，图中留空很正常。'] },
    ]
    case 'f2': return [
      { ...manual(47)[0], anatomyFocus: 'f2' },
      ...manual(48, 49, 50, 51),
      { title: '在工具里比较 F2', paragraphs: [`先在${targetsEntry}选你要发的元音，使用蓝色 F2 曲线。交替录自然版本与调整版本，每次给元音留一小段稳定时间，比较中间部分。`], steps: ['先保持 F0 大致相近，避免音高也大幅改变。', '比较同一个元音的两个版本，听音色，再看稳定段的 F2。', `选定一个容易重复的位置作为 F2 中心，参考窗口为中心上下各 ${TARGET_HALF_WIDTH_HZ.f2} Hz。`, '依次练不同元音，再练双元音与一句话；不同元音保留各自的中心。'] },
    ]
    case 'f1': return [
      { ...manual(53)[0], anatomyFocus: 'f1' },
      ...manual(54, 55),
      { title: '在工具里比较 F1', paragraphs: [`选择 a、o 或 e，观察粉色 F1 曲线。交替读两种嘴形，回放判断元音是否清楚，再比较中间稳定段。F1 目标窗口是中心上下各 ${TARGET_HALF_WIDTH_HZ.f1} Hz。`], steps: ['先录自然嘴形，再让下颌放松、多打开一点。', '保持相近音高与音量，重复两三次，确认 F1 的变化可以重现。', '把合适的位置设为该元音的 F1 中心，再试 ia、ie、ao、ou。', '回到自然句子，保留不同元音的开闭区别。'] },
    ]
    case 'practice-guide': return [
      { title: '把单项练习连起来', paragraphs: ['先练单元音，再练双元音、词语和整句话。每次开始时先复现已经熟悉的声音，再加一个变化。'], steps: ['以舒适的 F0 读 a、o、e、i、u、ü，找到稳定的起声。', '用 F2 练习中有效的动作，再读一遍相同元音，比较音色。', '在 a、o、e 上加入合适的开口变化，观察 F1，同时留意 F2。', '读 ai、ao、ou、ia、ie，保持过渡清楚，不把所有元音固定成一个嘴形。', '读「今天的天气很好」，再自由讲一件小事。停止并回放，听自然度与语调。'] },
      ...manual('assessment'),
      { title: '记录一次有效的练习', paragraphs: [`用${downloadEntry}保留当前片段。给录音写上元音、使用的动作和自己的听感，例如「a，下颌放松，开口多一点」；下一次用相同句子比较。`, '如果同一动作只在单元音有效，就先练短词，不急于增加句子长度。动作需要越做越大才能维持时，回到较小幅度重找协调。'] },
    ]
    case 'charts': return [
      { title: '一张图看 F0、F1、F2', paragraphs: ['横轴是时间，纵轴是频率 Hz。F0 紫、F1 粉、F2 蓝；同色区域为当前元音的目标窗口，虚线标出目标中心。切换元音或调整中心后，图上的窗口随之移动。', '点击图例中的 F0、F1、F2，可以单独隐藏或显示图上的曲线，关键实时反馈始终显示。先观察一个元音的稳定段，再看元音之间的过渡。'], visualization: 'chart-reading' },
      { title: '对数与线性坐标', paragraphs: ['对数坐标让相同频率倍数占相同距离：100→200 Hz 与 200→400 Hz 都是翻倍。它便于把较低的 F0 与较高的 F1、F2 放在一起观察。线性坐标则让相同 Hz 差占相同距离。', '在图上切换「对数 / 线性」即可，坐标仍标 Hz。图表会按有效测量值和目标扩展显示范围。'] },
      { title: '窗口概况与实时数值', paragraphs: ['上方三项显示当前保留窗口内各频率有效值的中位数，停顿不算 0；侧边或底部数值显示最新一帧，用来观察当前发声。', layout === 'portrait' ? '实时反馈中 ↑ 为高于窗口，↓ 为低于窗口，✓ 为进入窗口；没有有效值时显示 --。' : '实时反馈下方的文字说明当前值高于、低于或位于目标窗口；没有有效值时显示 --。'] },
      { title: '共振峰估计与平滑', paragraphs: ['共振峰是从录音频谱估计的。快速换元音、噪声和高音可能使曲线跳动，先对照回放，再比较重复发声的稳定部分。', '在「配置」中可开启平滑并设置窗口帧数（1–30，默认 5）。窗口较大能抑制短时毛刺，也会让元音切换显示得更慢；修改后从下一次录音或导入生效。'] },
      { title: '把曲线与频谱图对应起来', paragraphs: ['下面保留手册中的时频图。时频图的明暗表示不同频率上的能量，共振峰追踪点来自软件估计；本工具把这些结果简化成随时间移动的频率曲线。'], html: MANUAL_LESSONS['18'].html.match(/<figure[\s\S]*?<\/figure>/g)?.slice(0, 2).join('') },
    ]
    case 'targets': return [
      { title: '先选择元音', paragraphs: [`在${targetsEntry}选择 a、o、e、i、u、ü，每个元音保存自己的目标中心。比较 F1、F2 时，先把选择器切到正在发的元音。`] },
      { title: '按元音推荐或手动调整', paragraphs: ['先设置容易保持的 F0，再用「按元音推荐」填入当前元音的 F1、F2 参考区间：开口元音通常有较高 F1，闭口元音有较低 F1；前元音通常有较高 F2，后元音与圆唇会让 F2 降低。', '这些区间来自元音参考预设，用来开始比较练习。F0 由声带振动决定，F1、F2 由声道形状决定，单凭 F0 不能算出个人真实共振峰；听回放后可切到「手动」设置适合自己的中心。'] },
      { title: '一个中心，一个滑杆', paragraphs: ['每项只需设置中心值。拖动滑杆实时调整，数字输入在按 Enter 或失焦时保存；超出可用范围时会调整到边界。'], steps: [`F0：中心上下各 ${TARGET_HALF_WIDTH_HZ.f0} Hz。`, `F1：中心上下各 ${TARGET_HALF_WIDTH_HZ.f1} Hz。`, `F2：中心上下各 ${TARGET_HALF_WIDTH_HZ.f2} Hz。`] },
      { title: '怎样选择自己的中心', paragraphs: ['先录一段容易重复、听感合适的单元音，观察稳定片段，再把相应数值设为中心。彩色窗口帮助你保持一致，也方便比较前后变化。', `F0 目标窗口位于 ${F0_CHART_RANGE.min}–${F0_CHART_RANGE.max} Hz，F1、F2 位于 ${FORMANT_CHART_RANGE.min}–${FORMANT_CHART_RANGE.max} Hz 内；中心会预留窗口半宽，并保持 F1 上沿不高于 F2 下沿。`, '同一个元音多试几次再修改中心。数字越高并不自动代表更女性化，先听元音、音色与整句话是否符合你的目标。'] },
      { title: '恢复默认预设', paragraphs: ['点击重置图标并确认，会恢复全部元音的默认中心，并切回 a。下表列出默认中心与固定窗口，便于重新开始练习。'] },
    ]
    case 'audio': return [
      { title: '录音、停止与继续', paragraphs: [getQuickStartSteps(layout, config)[0].description, '再次开始录音会继续追加麦克风数据；从导入音频切换到麦克风时会开始新的声音数据。', `当前保留最近 ${config.audioRetentionSeconds} 秒。持续录音可以继续进行，较早部分会移出窗口；「配置 → 保留时长」可设置 5–120 秒，默认 20 秒。缩短时长会立即只保留较新的声音。`] },
      { title: '回放与清空', paragraphs: ['停止录音后点击「回放」，听当前窗口。回放时可结合图上游标查看声音变化。', `点击${layout === 'portrait' ? '底部「清除图谱」' : '顶栏「清空」'}会停止当前音频操作并清除声音数据，训练目标继续保留。`] },
      { title: '导入已有音频', paragraphs: [`通过${importEntry}选择文件，时长不超过「配置」中的保留时长；当前上限为 ${config.audioRetentionSeconds} 秒。较长片段先在音频编辑器中裁短。`, '可导入浏览器能解码的 WAV、MP3、M4A 等格式。导入后会分析并显示曲线，可以回放、调整元音目标，再与自己的发声比较。'] },
      { title: '下载 WAV 保存片段', paragraphs: [`通过${downloadEntry}保存当前窗口。文件为 16 kHz、单声道、16 位 PCM WAV，可再次导入。`, '下载时会先停止录音或回放。清空、刷新或切换数据之前先保存需要留下的片段。'] },
    ]
    case 'pitch-reference': return [
      { title: '用琴键建立音高参照', paragraphs: ['从顶部导航进入「音高参考」，点击琴键听对应音高；键名由音名和八度组成，如 C4、A3。桌面可聚焦琴键后按 Enter 或空格发音。', layout === 'portrait' ? '左右滑动钢琴键盘查看其他音域，轻点琴键发音。' : '在听到的音高附近轻哼，再回到说话音，熟悉音高之间的距离。'] },
      { title: '边发声边对照', paragraphs: ['开始录音后，琴键高亮和音高图显示检测到的音高。先保持一个短音，再做小幅上行与下行；练习 F0 时可以用它找到参考位置。', '清除、回放和导入与声音分析页共用。回到「声音分析」可以同时观察 F0、F1、F2。'] },
    ]
    case 'praat': return [
      ...manual('praat'),
      { title: '显示范围与分析参数', paragraphs: ['想放大 F1、F2 时，可缩小频谱图的显示范围；共振峰分析上限则要覆盖需要估计的声道共振，不能只因想看低频就统一降到 2000 Hz。', '在单元音中选取中间稳定段，再比较两段相同元音的 F0 和共振峰。若追踪线偏离明显能量带，先结合频谱与回放判断，再调整适合该声音的分析参数。'] },
    ]
    case 'extra': return [...manual(57, 58, 59, 60), { ...manual('references')[0], collapsed: true }]
    case 'troubleshooting': return [
      { title: '麦克风权限未允许', paragraphs: ['在地址栏的网站权限中允许麦克风，检查 Windows 隐私设置是否允许浏览器访问，再点击录音。本地使用一键启动脚本打开 localhost 页面。'] },
      { title: '找不到麦克风或设备被占用', paragraphs: ['检查设备连接和系统默认输入设备，关闭占用设备的其他应用，重新选择设备后再录音。蓝牙耳机切换输入模式时，可能需要重新连接。'] },
      { title: '正在录音，但曲线为空', paragraphs: ['先用平常音量说一个短句，检查系统输入音量是否有反应。若只有 F0，试着用稳定的 a 延长一点，再减少背景噪声。耳语、清辅音与停顿不一定有稳定的基频。'] },
      { title: '曲线跳动或共振峰追错', paragraphs: ['保持麦克风距离和音量接近，先发稳定元音。用回放核对异常片段，在「配置」中尝试平滑或另一种分析方法，再开始一次新的录音或导入。', 'F0 突然翻倍或减半时，先听实际音高是否改变；F1、F2 快速互换或贴近谐波时，先比较稳定片段。'] },
      { title: '导入过长或无法解码', paragraphs: [`先检查片段是否超过当前 ${config.audioRetentionSeconds} 秒上限；需要较长片段时，可在「配置 → 保留时长」增加。`, '仍无法解码时，用音频编辑器重新导出为常见 WAV 或 MP3，再导入。文件扩展名相同，内部编码仍可能不同。'] },
      { title: '下载、回放不可用', paragraphs: ['先录音或导入一段有效声音，再停止录音。下载的是当前保留窗口；清空后需要重新录音。', '如果浏览器阻止下载，检查下载提示和默认保存位置。重新启动页面会清空内存中的录音，先保存需要的片段。'] },
    ]
  }
}

export interface HelpSource { label: string; url: string; detail: string }
export function getHelpSources(_topic: HelpTopic): readonly HelpSource[] { return [] }
export function getRelatedHelpTopics(topic: HelpTopic): readonly HelpTopic[] {
  const index = HELP_TOPIC_ORDER.indexOf(topic)
  return [HELP_TOPIC_ORDER[index - 1], HELP_TOPIC_ORDER[index + 1]].filter((item): item is HelpTopic => Boolean(item))
}
