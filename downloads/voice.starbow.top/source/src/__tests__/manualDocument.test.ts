import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MANUAL_CHAPTERS, loadManualChapter } from '../content/manualDocument'
import { getManualFigureKind } from '../components/ManualFigure'

const original = new DOMParser().parseFromString(readFileSync('public/manual/index.html', 'utf8'), 'text/html')
const normalize = (value: string | null) => (value ?? '').replace(/\s/g, '')

// 仅豁免已按专业资料修订的声带肌说明和 F0 练习，其余原文仍完整比对。
const removeCorrectedPassages = (body: HTMLElement, chapterId: string) => {
  if (chapterId === 'foundations') {
    body.querySelectorAll('p').forEach(paragraph => {
      if (/^(甲杓肌|环甲肌)（/.test(paragraph.textContent ?? '')) paragraph.remove()
    })
  }
  if (chapterId === 'training') {
    const end = body.querySelector('#sec-46-E4BA8CE38081E99288E5AFB9E68F90E9AB9820F2EFBC88E9')
    let node: ChildNode | null = body.querySelector('#sec-42-E4B880E38081E99288E5AFB9E68F90E9AB9820F0EFBC9A')
    while (node && node !== end) {
      const next: ChildNode | null = node.nextSibling
      node.remove()
      node = next
    }
  }
}

describe('original manual content', () => {
  it('preserves original content in order apart from the duplicated title-page, corrected F0 passages and added references', async () => {
    const sourceChapters = Array.from(original.querySelectorAll('section.chapter'))
    expect(MANUAL_CHAPTERS).toHaveLength(sourceChapters.length)
    for (let index = 0; index < sourceChapters.length; index++) {
      const source = sourceChapters[index]
      const chapter = MANUAL_CHAPTERS[index]
      expect(chapter.sourceId).toBe(source.id)
      expect(chapter.title).toBe(source.querySelector('.chapter-title')?.textContent)
      const sourceBody = source.querySelector('.chapter-body')!.cloneNode(true) as HTMLElement
      sourceBody.querySelectorAll('.figure-grid, .figure-single').forEach(figure => figure.remove())
      if (chapter.id === 'introduction') {
        // 用户明确要求移除与页面标题区重复的作者和版本信息。
        sourceBody.querySelectorAll(':scope > p').forEach(paragraph => {
          if (['By Aoi', '2021 年 7 月 第一版 ｜ 2026 年 5 月 第二版'].includes(paragraph.textContent?.trim() ?? '')) paragraph.remove()
        })
      }
      const content = await loadManualChapter(chapter.id)
      const body = new DOMParser().parseFromString(content.flatMap(block => block.kind === 'html' ? [block.html] : []).join(''), 'text/html')
      removeCorrectedPassages(sourceBody, chapter.id)
      removeCorrectedPassages(body.body, chapter.id)
      const text = normalize(body.body.textContent)
      // 新来源从 [8] 追加，原有 [1]–[7] 仍逐字比对。
      expect(chapter.id === 'references' ? text.split('[8]')[0] : text, chapter.id).toBe(normalize(sourceBody.textContent))
      expect(body.querySelectorAll('table').length).toBe(sourceBody.querySelectorAll('table').length)
    }
  })

  it('explains coordinated F0 control and gradual practice toward higher speaking pitch', async () => {
    const blocks = await loadManualChapter('training')
    const body = new DOMParser().parseFromString(blocks.flatMap(block => block.kind === 'html' ? [block.html] : []).join(''), 'text/html')
    const start = body.querySelector('#sec-42-E4B880E38081E99288E5AFB9E68F90E9AB9820F0EFBC9A')!
    const end = body.querySelector('#sec-46-E4BA8CE38081E99288E5AFB9E68F90E9AB9820F2EFBC88E9')!
    const range = body.createRange()
    range.setStartAfter(start)
    range.setEndBefore(end)
    const revised = range.cloneContents()
    const text = normalize(revised.textContent)
    expect(text).toContain('环甲肌')
    expect(text).toContain('甲杓肌')
    expect(text).toContain('有效振动质量')
    expect(text).toContain('逐步提高说话F0，适应比原先更高的说话音域')
    expect(text).toContain('肌肉配合，也可以随着练习逐渐熟练')
    expect(text).toContain('不用把180Hz当成统一的及格线')
    expect(text).toContain('轻轻哼鸣或发元音→缓慢向上、向下滑音')
    expect(text).toContain('先说短词、短句→逐步延长，并用于日常说话')
    expect(text).not.toContain('拧紧吉他弦')
    expect(text).not.toContain('稳定在180Hz以上')
    expect(text).not.toContain('参考阅读')
    expect(text.match(/\[\d+\]/g)).toEqual(['[8]', '[9]', '[10]'])
  })

  it('keeps the three added professional sources together in the final references chapter', async () => {
    const urls = [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC5412481/',
      'https://transcare.ucsf.edu/guidelines/vocal-health',
      'https://www.nidcd.nih.gov/health/taking-care-your-voice',
    ]
    for (const chapter of MANUAL_CHAPTERS) {
      const blocks = await loadManualChapter(chapter.id)
      const body = new DOMParser().parseFromString(blocks.flatMap(block => block.kind === 'html' ? [block.html] : []).join(''), 'text/html')
      for (const url of urls) {
        expect(body.querySelectorAll(`a[href="${url}"]`).length, `${chapter.id}: ${url}`).toBe(chapter.id === 'references' ? 1 : 0)
      }
      if (chapter.id === 'references') {
        expect(body.body.textContent?.match(/\[\d+\]/g)).toEqual(Array.from({ length: 10 }, (_, index) => `[${index + 1}]`))
      }
    }
  })

  it('preserves all 26 illustrations and uses the original screenshots throughout the Praat chapter', async () => {
    const blocks = (await Promise.all(MANUAL_CHAPTERS.map(chapter => loadManualChapter(chapter.id)))).flat()
    const figures = blocks.flatMap(block => block.kind === 'figures' ? block.figures : [])
    const sourceFigures = Array.from(original.querySelectorAll('.chapter-body figure'))
    expect(figures).toHaveLength(26)
    expect(figures.map(figure => figure.src)).toEqual(sourceFigures.map(figure => figure.querySelector('img')!.getAttribute('src')))
    expect(figures.map(figure => figure.caption)).toEqual(sourceFigures.map(figure => figure.querySelector('figcaption')!.textContent))
    expect(figures.map(figure => getManualFigureKind(figure.src))).not.toContain(undefined)
    const training = (await loadManualChapter('training')).flatMap(block => block.kind === 'figures' ? block.figures : [])
    expect(training).toHaveLength(11)
    expect(training.every(figure => getManualFigureKind(figure.src) === 'praat-screenshot')).toBe(true)
    expect(getManualFigureKind('4.jpg')).toBe('praat-screenshot')
    expect(getManualFigureKind('示意图.jpg')).toBe('anatomy-plate')
  })
})
