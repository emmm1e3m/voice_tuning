import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MANUAL_CHAPTERS, loadManualChapter, type ManualBlock, type ManualChapter } from '../content/manualDocument'
import { ManualFigure } from '../components/ManualFigure'
import styles from './ManualPage.module.css'

const READING_NOTES: Record<string, string> = {
  foundations: '会厌是独立的弹性软骨，经韧带与舌骨、甲状软骨相连。咽分鼻咽、口咽和喉咽，与鼻腔、口腔相区分。肺提供气流动力，周期性嗓音的主要声源来自声带振动；共振峰由整个声道形状共同决定，不能由单个动作唯一推算。',
  perception: '文中的群体数据用于理解差异，不能据此判断个人性别或设定统一达标线，也不能仅由共振峰数值推断女性张口更大或舌体推得更用力。感知还受到语调、发音方式和语境影响。拼音 e 通常指后部不圆唇元音 /ɤ/，与国际音标 /e/ 有区别。',
  training: '练习以舒适、可持续为准。F2 无法单独指示喉位；HNR 越高通常表示周期成分越强，不能解释为气声更多。Twang 并非必需步骤，也不能保证保护声带。疼痛、持续沙哑时应停止练习。',
  review: '表中的数值保留为原作者的参考示例，适合与自己的录音比较，不是每个人都应达到的标准。舒适度、自然度与日常交流中的可持续性同样重要。',
}

const chapterTitle = (chapter: ManualChapter) => chapter.id === 'introduction' ? '目录' : chapter.title.replace(/：$/, '')

function inlineReadingNote(chapterId: string, html: string): string | null {
  const notes: string[] = []
  if (chapterId === 'foundations' && html.includes('Twang')) {
    notes.push('声源与声道确实可能发生非线性耦合，不能据此推出 Twang 保护嗓子或是必需训练。喉入口收窄对音色和发声效率的作用取决于具体发声状态；不能用“越窄越健康”指导练习。')
  }
  if (chapterId === 'foundations' && html.includes('0-5000Hz')) {
    notes.push('下方三幅源—滤波示意图的横轴为 0–3000 Hz；原文“0–5000 Hz”为标注错误。')
  }
  if (chapterId === 'perception' && html.includes('HNR')) {
    notes.push('HNR 是谐波能量与噪声能量之比：数值较高通常表示周期成分更强、相对噪声更少，不能解释为气声更多。F0、共振峰与其他特征共同影响感知，不存在一条适用于所有人的音高先决线。')
  }
  return notes.length ? notes.join(' ') : null
}

export function ManualPage() {
  const [params, setParams] = useSearchParams()
  const chapter = MANUAL_CHAPTERS.find(item => item.id === params.get('chapter')) ?? MANUAL_CHAPTERS[0]
  const index = MANUAL_CHAPTERS.indexOf(chapter)
  const isIntroduction = chapter.id === 'introduction'
  const pageRef = useRef<HTMLElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const [loaded, setLoaded] = useState<{ id: string; blocks: ManualBlock[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const blocks = loaded?.id === chapter.id ? loaded.blocks : null

  useEffect(() => {
    let active = true
    setFailed(false)
    loadManualChapter(chapter.id).then(content => {
      if (active) setLoaded({ id: chapter.id, blocks: content })
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [chapter.id, retry])

  useEffect(() => {
    if (!blocks) return
    const section = params.get('section')
    if (section) {
      const heading = Array.from(articleRef.current?.querySelectorAll<HTMLElement>('[id]') ?? []).find(item => item.id === section)
      heading?.scrollIntoView?.({ block: 'start' })
    } else {
      pageRef.current?.scrollTo?.({ top: 0 })
    }
  }, [chapter.id, blocks, params])

  const selectChapter = (id: string, section?: string) => {
    setParams(section ? { chapter: id, section } : { chapter: id })
  }

  return <main ref={pageRef} className={styles.page} aria-label="教学文档">
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>教学文档</p>
          <h1 className="page-title">MTF 声音女性化练习手册</h1>
          <p className={styles.byline}>By Aoi <span aria-hidden="true">·</span> 2026 年 5 月第二版</p>
          <p className={styles.revisionNote}>本应用在原手册基础上作了少量修订、校注与图示调整。原文请见<a href="https://mtf-voice-training.vercel.app/" target="_blank" rel="noreferrer">手册原站</a>。</p>
        </div>
        <Link className={styles.exploreLink} to="/interactive">打开发声交互演示 <span aria-hidden="true">↗</span></Link>
      </header>
      <div className={styles.readingLayout}>
        <aside className={styles.sidebar}>
          <p className={styles.directoryLabel}>阅读目录</p>
          <label className={styles.mobileSelect}>当前章节
            <select value={chapter.id} onChange={event => selectChapter(event.target.value)}>
              {MANUAL_CHAPTERS.map((item, number) => <option key={item.id} value={item.id}>{String(number + 1).padStart(2, '0')} · {chapterTitle(item)}</option>)}
            </select>
          </label>
          <nav className={styles.directory} aria-label="教学文档目录">
            {MANUAL_CHAPTERS.map((item, number) => <div key={item.id}>
              <button className={styles.chapterButton} type="button" aria-current={item.id === chapter.id ? 'page' : undefined} onClick={() => selectChapter(item.id)}>
                <span>{String(number + 1).padStart(2, '0')}</span><span>{chapterTitle(item)}</span>
              </button>
              {item.id === chapter.id && item.headings.length > 0 && <div className={styles.subdirectory}>
                {item.headings.map(heading => <button type="button" key={heading.id} aria-current={params.get('section') === heading.id ? 'location' : undefined} onClick={() => selectChapter(item.id, heading.id)}>{heading.title.replace(/^[一二三四]、/, '').replace(/：$/, '')}</button>)}
              </div>}
            </div>)}
          </nav>
          <p className={styles.sidebarNote}>按原文章节编排，保留正文、练习与参考文献。</p>
        </aside>
        <article ref={articleRef} className={styles.article} aria-label={isIntroduction ? '目录' : undefined} aria-labelledby={isIntroduction ? undefined : 'manual-chapter-title'} aria-busy={!blocks && !failed}>
          {!isIntroduction && <header className={styles.chapterHeader}>
            <p>第 {index + 1} 章 <span aria-hidden="true">/</span> 共 {MANUAL_CHAPTERS.length} 章</p>
            <h2 id="manual-chapter-title">{chapterTitle(chapter)}</h2>
          </header>}
          {READING_NOTES[chapter.id] && <aside className={styles.readingNote} aria-label="阅读注"><strong>阅读注</strong><p>{READING_NOTES[chapter.id]}</p></aside>}
          {failed ? <div className={styles.loading}><p>本章暂时未能加载。</p><button type="button" onClick={() => setRetry(value => value + 1)}>重新加载</button></div> : !blocks ? <p className={styles.loading} role="status">正在打开本章…</p> : <div className={styles.chapterBody}>
            {blocks.map((block, blockIndex) => {
              if (block.kind === 'figures') return <div className={styles.figures} data-count={block.figures.length} key={blockIndex}>{block.figures.map(figure => <ManualFigure key={figure.src} src={figure.src} caption={figure.caption} />)}</div>
              const note = inlineReadingNote(chapter.id, block.html)
              return <div key={blockIndex}>
                <div className={styles.prose} dangerouslySetInnerHTML={{ __html: block.html }} />
                {note && <aside className={styles.readingNote} aria-label="本节校注"><strong>校注</strong><p>{note}</p></aside>}
              </div>
            })}
          </div>}
          <nav className={styles.chapterNavigation} aria-label="教学文档前后章节">
            {index > 0 && <button type="button" onClick={() => selectChapter(MANUAL_CHAPTERS[index - 1].id)}><span>← 上一章</span><strong>{chapterTitle(MANUAL_CHAPTERS[index - 1])}</strong></button>}
            {index < MANUAL_CHAPTERS.length - 1 && <button type="button" className={styles.nextChapter} onClick={() => selectChapter(MANUAL_CHAPTERS[index + 1].id)}><span>下一章 →</span><strong>{chapterTitle(MANUAL_CHAPTERS[index + 1])}</strong></button>}
          </nav>
          <footer className={styles.footer}>原作者：<a href="https://space.bilibili.com/942770" target="_blank" rel="noreferrer">あおぎ葵 / Aoi</a><span aria-hidden="true">·</span><a href="https://mtf-voice-training.vercel.app/" target="_blank" rel="noreferrer">手册原站</a></footer>
        </article>
      </div>
    </div>
  </main>
}
