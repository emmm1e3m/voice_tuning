import { F0_CHART_RANGE, FORMANT_CHART_RANGE } from '../config/analysisRanges'
import { recommendVowelTargets, TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { VOWEL_PRESETS, presetShortLabel, DEFAULT_CONFIG, type AppConfig } from '../types'

export type HelpTopic = 'quick-start' | 'f0' | 'f2' | 'f1' | 'charts' | 'targets' | 'audio' | 'troubleshooting' | 'pitch-reference' | 'statistics'
export type HelpLayout = 'portrait' | 'landscape'
export interface HelpSection {
  title: string
  paragraphs: readonly string[]
  steps?: readonly string[]
  visualization?: 'chart-reading'
}
type HelpConfig = Pick<AppConfig, 'audioRetentionSeconds' | 'formantSmoothingWindow'>
export const HELP_TOPIC_ORDER: readonly HelpTopic[] = ['quick-start', 'f0', 'f2', 'f1', 'charts', 'targets', 'audio', 'pitch-reference', 'statistics', 'troubleshooting']
export const HELP_TOPIC_GROUPS: readonly { label: string; topics: readonly HelpTopic[] }[] = [
  { label: '开始使用', topics: ['quick-start'] },
  { label: '查看声音', topics: ['f0', 'f2', 'f1', 'charts'] },
  { label: '操作与设置', topics: ['targets', 'audio', 'pitch-reference', 'statistics', 'troubleshooting'] },
]
const TITLES: Record<HelpTopic, string> = {
  'quick-start': '快速上手', f0: 'F0 · 音高', f2: 'F2 · 共振与元音', f1: 'F1 · 开口与元音',
  charts: '读图与反馈', targets: '训练目标', audio: '录音与导入', 'pitch-reference': '音高参考', statistics: '统计分析', troubleshooting: '遇到问题',
}
export function getHelpTopicTitle(topic: HelpTopic): string { return TITLES[topic] }

export function getQuickStartSteps(layout: HelpLayout, config: HelpConfig = DEFAULT_CONFIG) {
  return [
    { title: '录下第一句声音', description: layout === 'portrait'
      ? '点击底部麦克风按钮开始录音；首次使用时，按浏览器提示允许麦克风权限。先自然地说一句「今天的天气很好」，再点击同一按钮停止。'
      : '点击顶栏「开始录音」；首次使用时，按浏览器提示允许麦克风权限。先自然地说一句「今天的天气很好」，再点击「停止录音」。' },
    { title: '回放，再看三条曲线', description: `点击「回放」，先听自己的声音。图中 F0 紫、F1 粉、F2 蓝，曲线和目标区域保持同色：F0 对应声音高低，F1、F2 帮助观察元音和共振。上方三个数值概括当前保留窗口；图内游标可查看具体时刻的频率与声区。` },
    { title: '选择目标，开始一次短练习', description: `${layout === 'portrait' ? '点击底部「当前目标」' : '在左侧「目标频率设置」'}先选 a，设置舒适的 F0；「随F0推荐」会按所选元音与 F0 目标更新 F1、F2 参考区间，也可切到「手动」调整。数字输入失焦或按 Enter 生效，滑杆实时生效。先短发一个 a，停止并回放；接着点击 F0 的帮助图标查看数值说明。当前保留最近 ${config.audioRetentionSeconds} 秒，可在「配置 → 保留时长」修改。` },
  ] as const
}
export function getPresetRows() {
  return Object.entries(VOWEL_PRESETS).map(([key, preset]) => {
    const bands = recommendVowelTargets({
      f0: { range: VOWEL_PRESETS['vowel-a'].f0, color: '' },
      f1: { range: preset.f1, color: '' },
      f2: { range: preset.f2, color: '' },
    }, key)
    return { vowel: presetShortLabel(key), ranges: [bands.f0.range, bands.f1.range, bands.f2.range] }
  })
}

export function getHelpSections(topic: HelpTopic, layout: HelpLayout, config: HelpConfig = DEFAULT_CONFIG): readonly HelpSection[] {
  const targetsEntry = layout === 'portrait' ? '底部「当前目标」' : '左侧「目标频率设置」'
  const importEntry = layout === 'portrait' ? '右上角「更多 → 导入音频」' : '顶栏「导入音频」'
  const downloadEntry = layout === 'portrait' ? '右上角「更多 → 下载 WAV」' : '顶栏「下载 WAV」'
  const sections = getQuickStartSteps(layout, config).map(step => ({ title: step.title, paragraphs: [step.description] }))
  switch (topic) {
    case 'quick-start': return [
      ...sections,
      { title: '页面怎样使用', paragraphs: ['「声音分析」录音、导入并比较 F0/F1/F2；「音高参考」提供钢琴与音高对照。「统计分析」单独录制或导入最长 60 秒的片段，查看整体音高分布。', '「交互演示」将六个发声动作、元音位置、声道剖面与频谱联动；「教学文档」按原手册章节阅读原理和练习。声音分析与音高参考共用录音和目标；切换标签会暂停统计录音，保留草稿与最近报告，返回统计页可继续。统计数据在刷新或关闭应用后清除。演示中的调整不会改动训练目标。'] },
    ]
    case 'f0': return [
      { title: '在程序中观察 F0', paragraphs: ['F0 是声带振动的基频，对应声音高低。声音分析中用紫色显示；音高参考页可听琴键并对照。'] },
      { title: '开始前：选 a，录一段自然声音', paragraphs: [`在${targetsEntry}选择 a，先用平常的声音发 a，再说一句短话。听回放、看紫色 F0 曲线，把这个位置作为比较的起点。`] },
      { title: '把音高放进目标中心', paragraphs: [`找到喜欢且容易重复的音高后，调整 F0 中心；图中会显示中心上下各 ${TARGET_HALF_WIDTH_HZ.f0} Hz 的紫色窗口。说话中的升降会超出窗口的一部分，先观察稳定发声和整句话的走势。`, '突然跳到约两倍或一半时，回放核对是否真的换了发声方式。停顿和清辅音没有稳定 F0，图中留空很正常。'] },
    ]
    case 'f2': return [
      { title: '在程序中观察 F2', paragraphs: ['F2 是第二共振峰，用蓝色显示，帮助比较同一元音的共振与音色。结合回放比较稳定段，完整训练方法见教学文档。'] },
      { title: '在工具里比较 F2', paragraphs: [`先在${targetsEntry}选你要发的元音，使用蓝色 F2 曲线。交替录自然版本与调整版本，每次给元音留一小段稳定时间，比较中间部分。`], steps: ['先保持 F0 大致相近，避免音高也大幅改变。', '比较同一个元音的两个版本，听音色，再看稳定段的 F2。', `选定一个容易重复的位置作为 F2 中心，参考窗口为中心上下各 ${TARGET_HALF_WIDTH_HZ.f2} Hz。`, '依次练不同元音，再练双元音与一句话；不同元音保留各自的中心。'] },
    ]
    case 'f1': return [
      { title: '在程序中观察 F1', paragraphs: ['F1 是第一共振峰，用粉色显示。比较相同音高下不同开口的稳定元音，再听回放确认元音是否清晰。'] },
      { title: '在工具里比较 F1', paragraphs: [`选择 a、o 或 e，观察粉色 F1 曲线。交替读两种嘴形，回放判断元音是否清楚，再比较中间稳定段。F1 目标窗口是中心上下各 ${TARGET_HALF_WIDTH_HZ.f1} Hz。`], steps: ['先录自然嘴形，再让下颌放松、多打开一点。', '保持相近音高与音量，重复两三次，确认 F1 的变化可以重现。', '把合适的位置设为该元音的 F1 中心，再试 ia、ie、ao、ou。', '回到自然句子，保留不同元音的开闭区别。'] },
    ]
    case 'charts': return [
      { title: '一张图看 F0、F1、F2', paragraphs: ['横轴是时间，纵轴是频率 Hz。F0 紫、F1 粉、F2 蓝；同色区域为当前元音的目标窗口，虚线标出目标中心。切换元音或调整中心后，图上的窗口随之移动。', '点击图例中的 F0、F1、F2，可以单独隐藏或显示图上的曲线；图内游标仍可查看频率与声区。先观察一个元音的稳定段，再看元音之间的过渡。'], visualization: 'chart-reading' },
      { title: '对数与线性坐标', paragraphs: ['对数坐标让相同频率倍数占相同距离：100→200 Hz 与 200→400 Hz 都是翻倍。它便于把较低的 F0 与较高的 F1、F2 放在一起观察。线性坐标则让相同 Hz 差占相同距离。', '在图上切换「对数 / 线性」即可，坐标仍标 Hz。图表会按有效测量值和目标扩展显示范围。'] },
      { title: '窗口概况与图内读数', paragraphs: ['上方三项显示当前保留窗口内各频率有效值的中位数，停顿不算 0。移动图内游标可查看对应时刻的频率与声区。'] },
      { title: '声区怎样帮助练习', paragraphs: ['声区背景帮助观察滑音、换声和延长元音时发声方式是否稳定，找出突然切换的位置，再对照回放调整协调。颜色不代表训练成绩。', '打开「配置 → 声区校准」，可直接开始录音，在自己感知的真假音边界保持同一元音，点击「采集边界声」。程序以这段声音中高于相对强度阈值的谐波峰数量建立个人过渡区；比较时保持相近音高、元音、响度与麦克风位置；跨越较大音域或更换设备后可重新校准。它统计 H2–H10 相对 H1 衰减不足 20 dB 的谐波峰，不是 F1/F2 共振峰，也不只凭音高判断声区。'] },
      { title: '共振峰估计与平滑', paragraphs: ['共振峰是从录音频谱估计的。快速换元音、噪声和高音可能使曲线跳动，先对照回放，再比较重复发声的稳定部分。', '在「配置」中可开启平滑并设置窗口帧数（1–30，默认 5）。窗口较大能抑制短时毛刺，也会让元音切换显示得更慢；修改后从下一次录音或导入生效。'] },
    ]
    case 'targets': return [
      { title: '先选择元音', paragraphs: [`在${targetsEntry}选择 a、o、e、i、u、ü，F0 目标跨元音共用；手动模式为每个元音保存各自的 F1、F2 中心。比较 F1、F2 时，先把选择器切到正在发的元音。`] },
      { title: '随F0推荐或手动调整', paragraphs: ['先设置跨元音共用的 F0 目标；「随F0推荐」会同时更新当前元音的 F1、F2，切换元音时保留 F0。推荐中心按手册中两组元音参考值随 F0 目标连续插值，参考档位外继续延伸。开口元音通常有较高 F1，前元音通常有较高 F2。', '这些区间用于选择练习的起点。F0 由声带振动决定，F1、F2 由声道形状决定，单凭 F0 不能算出个人真实共振峰；听回放后可切到「手动」设置适合自己的中心。'] },
      { title: '一个中心，一个滑杆', paragraphs: ['每项只需设置中心值。拖动滑杆实时调整，数字输入在按 Enter 或失焦时保存；超出可用范围时会调整到边界。'], steps: [`F0：中心上下各 ${TARGET_HALF_WIDTH_HZ.f0} Hz。`, `F1：中心上下各 ${TARGET_HALF_WIDTH_HZ.f1} Hz。`, `F2：中心上下各 ${TARGET_HALF_WIDTH_HZ.f2} Hz。`] },
      { title: '怎样选择自己的中心', paragraphs: ['先录一段容易重复、听感合适的单元音，观察稳定片段，再把相应数值设为中心。彩色窗口帮助你保持一致，也方便比较前后变化。', `F0 目标窗口位于 ${F0_CHART_RANGE.min}–${F0_CHART_RANGE.max} Hz，F1、F2 位于 ${FORMANT_CHART_RANGE.min}–${FORMANT_CHART_RANGE.max} Hz 内；中心会预留窗口半宽，并保持 F1 上沿不高于 F2 下沿。`, '同一个元音多试几次再修改中心。数字越高并不自动代表更女性化，先听元音、音色与整句话是否符合你的目标。'] },
      { title: '恢复默认预设', paragraphs: ['点击重置图标并确认，会恢复全部元音的默认中心，并切回 a。下表列出默认中心与固定窗口，便于重新开始练习。'] },
    ]
    case 'audio': return [
      { title: '录音、停止与继续', paragraphs: [getQuickStartSteps(layout, config)[0].description, '再次开始录音会继续追加麦克风数据；从导入音频切换到麦克风时会开始新的声音数据。', `当前保留最近 ${config.audioRetentionSeconds} 秒。持续录音可以继续进行，较早部分会移出窗口；「配置 → 保留时长」可设置 5–120 秒，默认 10 秒。缩短时长会立即只保留较新的声音。`] },
      { title: '回放与清空', paragraphs: ['停止录音后点击「回放」，听当前窗口。回放时可结合图上游标查看声音变化。', `点击${layout === 'portrait' ? '底部「清除图谱」' : '顶栏「清空」'}会停止当前音频操作并清除声音数据，训练目标继续保留。`] },
      { title: '导入已有音频', paragraphs: [`通过${importEntry}选择文件，时长不超过「配置」中的保留时长；当前上限为 ${config.audioRetentionSeconds} 秒。较长片段先在音频编辑器中裁短。`, '可导入浏览器能解码的 WAV、MP3、M4A 等格式。导入后会分析并显示曲线，可以回放、调整元音目标，再与自己的发声比较。'] },
      { title: '下载 WAV 保存片段', paragraphs: [`通过${downloadEntry}保存当前窗口。文件为 16 kHz、单声道、16 位 PCM WAV，可再次导入。`, '下载时会先停止录音或回放。清空、刷新或切换数据之前先保存需要留下的片段。'] },
    ]
    case 'pitch-reference': return [
      { title: '用琴键建立音高参照', paragraphs: ['从顶部导航进入「音高参考」，点击琴键听对应音高；键名由音名和八度组成，如 C4、A3。桌面可聚焦琴键后按 Enter 或空格发音。', layout === 'portrait' ? '左右滑动钢琴键盘查看其他音域，轻点琴键发音。' : '在听到的音高附近轻哼，再回到说话音，熟悉音高之间的距离。'] },
      { title: '边发声边对照', paragraphs: ['开始录音后，琴键高亮和音高图显示检测到的音高。先保持一个短音，再做小幅上行与下行；练习 F0 时可以用它找到参考位置。', '清除、回放和导入与声音分析页共用。回到「声音分析」可以同时观察 F0、F1、F2。'] },
    ]
    case 'statistics': return [
      { title: '录制或导入一段声音', paragraphs: ['「统计分析」使用独立的 60 秒时长上限，与声音分析页的保留时长分开。可选择中文或英文朗读材料，也可以自然说话。'], steps: ['点击「开始录音」后朗读；需要停顿时选择「暂停录音」，再选择「继续录音」接着录。暂停期间不计入录音时长。', '点击「完成并分析」结束采集并生成本次统计。', '也可通过「导入音频」选择最长 60 秒的已有片段，生成同样的统计。'] },
      { title: '中位数、P10/P90 与音高分布', paragraphs: ['把有效发声音高从低到高排列，F0 中位数位于中间，P10、P90 分别位于约 10%、90% 处。P10 到 P90 之间概括中间约 80% 的变化范围。', '音高分布显示有效发声在不同频率区间所占的比例。结合中位数和 P10/P90，可比较这段声音集中在哪里、起伏有多大；听感仍需结合原录音。'] },
      { title: '统计范围与样本长度', paragraphs: ['统计只纳入 60–500 Hz 内的有效 F0，停顿和无有效音高的片段不按 0 计算。高于 500 Hz 的部分从中位数、P10/P90 和音高分布中剔除，另列时长与比例。', '有效发声不足 3 秒时显示「数据不足」；达到 3 秒但不足 10 秒时提示样本较短。可以继续录制更完整的一段，再比较结果。'] },
      { title: '结果保留到什么时候', paragraphs: ['切换到其他标签会暂停统计录音，草稿与最近报告继续保留；返回「统计分析」后可继续录音或查看报告。数据只在当前应用打开期间临时保留，刷新或关闭应用后清除。'] },
    ]
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

export function getRelatedHelpTopics(topic: HelpTopic): readonly HelpTopic[] {
  const index = HELP_TOPIC_ORDER.indexOf(topic)
  return [HELP_TOPIC_ORDER[index - 1], HELP_TOPIC_ORDER[index + 1]].filter((item): item is HelpTopic => Boolean(item))
}
