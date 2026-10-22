import { expect, it } from 'vitest'
import { HELP_TOPIC_ORDER, HELP_TOPIC_GROUPS, getHelpSections, getHelpTopicTitle, getRelatedHelpTopics, getPresetRows, getQuickStartSteps } from '../content/helpContent'
import { F0_CHART_RANGE, FORMANT_CHART_RANGE } from '../config/analysisRanges'
import { TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { DEFAULT_CONFIG } from '../types'

it('organizes program operations from quick start through troubleshooting', () => {
  expect(HELP_TOPIC_ORDER[0]).toBe('quick-start')
  expect(HELP_TOPIC_ORDER[HELP_TOPIC_ORDER.length - 1]).toBe('troubleshooting')
  expect(HELP_TOPIC_GROUPS.flatMap(group => [...group.topics])).toEqual(HELP_TOPIC_ORDER)
  expect(HELP_TOPIC_ORDER).toContain('statistics')
  for (const topic of HELP_TOPIC_ORDER) {
    expect(getHelpTopicTitle(topic)).not.toBe('')
    expect(getHelpSections(topic, 'portrait').length).toBeGreaterThan(0)
  }
  expect(getRelatedHelpTopics('f2')).toEqual(['f0', 'f1'])
})
it('keeps original manual chapters and illustrations out of program help', () => {
  const sections = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')])
  expect(HELP_TOPIC_ORDER).not.toContain('foreword')
  expect(HELP_TOPIC_ORDER).not.toContain('anatomy')
  const text = JSON.stringify(sections)
  expect(text).not.toContain('为什么练习声音女性化')
  expect(text).not.toContain('manual/mineru_output')
  for (const topic of ['f0', 'f2', 'f1'] as const) {
    expect(getHelpSections(topic, 'portrait').some(section => section.title === `在程序中观察 ${topic.toUpperCase()}`)).toBe(true)
  }
})
it('provides three first-use operations with the current layout entries', () => {
  expect(getQuickStartSteps('portrait')).toHaveLength(3)
  expect(getQuickStartSteps('portrait')[0].description).toContain('底部')
  expect(getQuickStartSteps('landscape')[0].description).toContain('顶栏')
  expect(getQuickStartSteps('portrait')[2].description).toContain('当前目标')
  expect(getQuickStartSteps('landscape')[2].description).toContain('左侧')
})
it('reads default target centers from presets and describes fixed widths', () => {
  expect(getPresetRows()).toHaveLength(6)
  expect(getPresetRows()[0]).toEqual({ vowel: 'a', ranges: [[200, 280], [815, 1015], [1300, 1600]] })
  for (const row of getPresetRows()) expect(row.ranges[0]).toEqual([200, 280])
  const text = JSON.stringify(getHelpSections('targets', 'portrait'))
  for (const half of Object.values(TARGET_HALF_WIDTH_HZ)) expect(text).toContain(`各 ${half} Hz`)
  expect(text).toContain(`${F0_CHART_RANGE.min}–${F0_CHART_RANGE.max}`)
  expect(text).toContain(`${FORMANT_CHART_RANGE.min}–${FORMANT_CHART_RANGE.max}`)
  expect(text).not.toContain('至少相隔 50')
})
it('describes one chart, window medians, chart readings and configurable smoothing', () => {
  const text = JSON.stringify(getHelpSections('charts', 'portrait'))
  expect(text).toContain('一张图')
  expect(text).toContain('中位数')
  expect(text).toContain('停顿不算 0')
  expect(text).toContain('图内游标')
  expect(text).toContain('窗口帧数')
  expect(text).not.toContain('两张图')
  expect(text).not.toContain('实时反馈')
  expect(text).toContain('配置 → 声区校准')
  expect(text).not.toContain('图表下方「声区校准」')
  expect(text).not.toContain('隐藏或显示曲线与反馈')
  expect(getHelpSections('charts', 'portrait')[0].visualization).toBe('chart-reading')
})
it('uses current retention settings for recording, import and export instructions', () => {
  const config = { ...DEFAULT_CONFIG, audioRetentionSeconds: 47 }
  const text = JSON.stringify(getHelpSections('audio', 'portrait', config))
  expect(text).toContain('最近 47 秒')
  expect(text).toContain('当前上限为 47 秒')
  expect(text).toContain('更多 → 下载 WAV')
  expect(text).toContain('16 kHz')
  expect(text).toContain('保留时长')
})
it('includes a chart-reading example without importing theoretical teaching labs', () => {
  const all = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')])
  expect(all.filter(section => section.visualization === 'chart-reading')).toHaveLength(1)
  expect(all.map(section => section.visualization)).not.toContain('source-filter')
  expect(all.map(section => section.visualization)).not.toContain('vowel-map')
})
it('explains independent statistics recording, eligible pitch and temporary results', () => {
  expect(getHelpTopicTitle('statistics')).toBe('统计分析')
  const config = { ...DEFAULT_CONFIG, audioRetentionSeconds: 47 }
  const sections = getHelpSections('statistics', 'portrait', config)
  expect(sections).toEqual(getHelpSections('statistics', 'landscape', config))
  const text = JSON.stringify(sections)
  for (const phrase of ['独立的 60 秒', '暂停录音', '继续录音', '完成并分析', '导入音频', '中位数', 'P10', 'P90', '音高分布', '60–500 Hz', '高于 500 Hz', '剔除', '不足 3 秒', '不足 10 秒', '草稿与最近报告继续保留', '刷新或关闭应用后清除']) {
    expect(text).toContain(phrase)
  }
  expect(text).not.toContain('47 秒')
  const quickStart = JSON.stringify(getHelpSections('quick-start', 'portrait'))
  expect(quickStart).toContain('保留草稿与最近报告')
  expect(quickStart).toContain('刷新或关闭应用后清除')
  expect(text + quickStart).not.toContain('离开该页或刷新后清除')
})
