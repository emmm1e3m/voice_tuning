import { expect, it } from 'vitest'
import { HELP_TOPIC_ORDER, HELP_TOPIC_GROUPS, getHelpSections, getHelpTopicTitle, getRelatedHelpTopics, getPresetRows, getQuickStartSteps } from '../content/helpContent'
import { F0_CHART_RANGE, FORMANT_CHART_RANGE } from '../config/analysisRanges'
import { TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { DEFAULT_CONFIG, VOWEL_PRESETS } from '../types'
import { MANUAL_LESSONS } from '../content/manualLessons'

it('provides a continuous path from first recording through theory, practice and troubleshooting', () => {
  expect(HELP_TOPIC_ORDER[0]).toBe('quick-start')
  expect(HELP_TOPIC_ORDER[HELP_TOPIC_ORDER.length - 1]).toBe('troubleshooting')
  expect(HELP_TOPIC_GROUPS.flatMap(group => [...group.topics])).toEqual(HELP_TOPIC_ORDER)
  for (const topic of HELP_TOPIC_ORDER) {
    expect(getHelpTopicTitle(topic)).not.toBe('')
    expect(getHelpSections(topic, 'portrait').length).toBeGreaterThan(0)
  }
  expect(getRelatedHelpTopics('f2')).toEqual(['f0', 'f1'])
})
it('integrates substantive manual theory, training and all 26 original images', () => {
  const lessons = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')])
  const paths = new Set(lessons.flatMap(section => [...(section.imagePaths ?? [])]))
  expect(paths.size).toBe(26)
  expect(lessons.map(section => section.paragraphs.join('')).join('').length).toBeGreaterThan(16000)
  for (const topic of ['f0', 'f2', 'f1'] as const) {
    const sections = getHelpSections(topic, 'portrait')
    expect(sections.some(section => section.imagePaths?.length)).toBe(true)
    expect(sections.some(section => section.title.includes('读图'))).toBe(true)
    expect(sections.some(section => section.steps?.length || section.html?.includes('<ol>'))).toBe(true)
    expect(sections.some(section => section.anatomyFocus === topic)).toBe(true)
  }
})
it('keeps full source-filter teaching and places HNR and Twang explanations in the relevant chapters', () => {
  const theory = JSON.stringify(getHelpSections('source-filter', 'portrait'))
  expect(theory).toContain('谐波')
  expect(theory).toContain('扰动理论')
  expect(theory).toContain('共振峰')
  const perception = JSON.stringify(getHelpSections('perception', 'portrait'))
  expect(perception).toContain('谐波能量与噪声能量之比')
  expect(JSON.stringify(getHelpSections('extra', 'portrait'))).toContain('可选的音色技巧')
  expect(theory).not.toContain('不是原作者发布的新版本')
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
  const preset = VOWEL_PRESETS['vowel-a']
  expect(getPresetRows()[0]).toEqual({ vowel: 'a', ranges: [preset.f0, preset.f1, preset.f2] })
  const text = JSON.stringify(getHelpSections('targets', 'portrait'))
  for (const half of Object.values(TARGET_HALF_WIDTH_HZ)) expect(text).toContain(`各 ${half} Hz`)
  expect(text).toContain(`${F0_CHART_RANGE.min}–${F0_CHART_RANGE.max}`)
  expect(text).toContain(`${FORMANT_CHART_RANGE.min}–${FORMANT_CHART_RANGE.max}`)
  expect(text).not.toContain('至少相隔 50')
})
it('describes one chart, window medians, real-time values and configurable smoothing', () => {
  const text = JSON.stringify(getHelpSections('charts', 'portrait'))
  expect(text).toContain('一张图')
  expect(text).toContain('中位数')
  expect(text).toContain('停顿不算 0')
  expect(text).toContain('最新一帧')
  expect(text).toContain('窗口帧数')
  expect(text).not.toContain('两张图')
  expect(text).toContain('关键实时反馈始终显示')
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
it('embeds only sanitized local illustrations and static text from the manual', () => {
  const sections = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')])
  for (const section of sections) {
    expect(section.html ?? '').not.toMatch(/<script|<style|\son\w+=|javascript:/i)
    for (const path of section.imagePaths ?? []) expect(path).toMatch(/^manual\//)
  }
})
it('answers every review question with a concise explicit answer', () => {
  const manualReviews = Object.values(MANUAL_LESSONS).filter(section => section.title.startsWith('复习'))
  expect(manualReviews).toHaveLength(4)
  let questionCount = 0
  for (const section of manualReviews) {
    expect(section.questions?.length).toBe(section.paragraphs.length)
    for (const item of section.questions ?? []) {
      expect(item.question.trim()).not.toBe('')
      expect(item.answer.trim().length).toBeGreaterThan(10)
      expect(item.answer).not.toMatch(/参见正文|自行思考|略|见上文/)
      questionCount++
    }
  }
  expect(questionCount).toBe(16)
  const displayedReviews = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')]).filter(section => section.title.startsWith('复习'))
  expect(displayedReviews).toHaveLength(manualReviews.length)
  for (const section of displayedReviews) expect(section.questions?.length).toBeGreaterThan(0)
})
it('places each interactive theory diagram once at its explanatory chapter', () => {
  const all = HELP_TOPIC_ORDER.flatMap(topic => [...getHelpSections(topic, 'landscape')])
  expect(all.filter(section => section.visualization === 'source-filter')).toHaveLength(1)
  expect(all.filter(section => section.visualization === 'vowel-map')).toHaveLength(1)
  expect(getHelpSections('source-filter', 'landscape').some(section => section.visualization === 'source-filter')).toBe(true)
  expect(getHelpSections('perception', 'landscape').some(section => section.visualization === 'vowel-map')).toBe(true)
})
