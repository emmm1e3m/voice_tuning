import { useEffect, useId, useRef } from 'react'
import { Modal } from './Modal'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAppStore } from '../store/appStore'
import { AnatomyExplorer } from './AnatomyExplorer'
import { SourceFilterLab } from './SourceFilterLab'
import { VowelMap } from './VowelMap'
import { ChartReadingExample } from './ChartReadingExample'
import { HELP_TOPIC_ORDER, HELP_TOPIC_GROUPS, getHelpTopicTitle, getHelpSections, getRelatedHelpTopics, getPresetRows, type HelpSection, type HelpTopic } from '../content/helpContent'
import { TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import styles from './HelpDrawer.module.css'

interface HelpDrawerProps {
  open: boolean
  onClose: () => void
  topic: HelpTopic
  onTopicChange: (topic: HelpTopic) => void
  getFallbackFocus?: () => HTMLElement | null
}
const MANUAL_BASE = `${import.meta.env.BASE_URL === './' ? '/' : import.meta.env.BASE_URL}manual/`
function sectionHtml(section: HelpSection) {
  return (section.html ?? '').replace(/src="manual\//g, `src="${MANUAL_BASE}`)
}

export function HelpDrawer({ open, onClose, topic, onTopicChange, getFallbackFocus }: HelpDrawerProps) {
  const portrait = useMediaQuery('(max-width: 768px)')
  const config = useAppStore(state => state.config)
  const articleRef = useRef<HTMLElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const navFocused = useRef(false)
  const previousPortrait = useRef(portrait)
  const id = useId().replace(/:/g, '')
  const sections = getHelpSections(topic, portrait ? 'portrait' : 'landscape', config)
  const topicIndex = HELP_TOPIC_ORDER.indexOf(topic)
  useEffect(() => {
    articleRef.current?.scrollTo?.({ top: 0 })
  }, [topic, open])
  useEffect(() => {
    if (previousPortrait.current !== portrait && open && navFocused.current) {
      navigationRef.current?.querySelector<HTMLElement>('select, button[aria-pressed="true"]')?.focus()
    }
    previousPortrait.current = portrait
  }, [portrait, open])
  const navigateSection = (index: number) => {
    const heading = articleRef.current?.querySelector<HTMLElement>(`[data-section-index="${index}"]`)
    heading?.scrollIntoView?.({ block: 'start' })
    heading?.focus({ preventScroll: true })
  }
  return <Modal open={open} title="使用说明" variant="learning" onClose={onClose} getFallbackFocus={getFallbackFocus}>
    <div className={styles.learningRoot}>
      <div ref={navigationRef} className={styles.navigation}
        onFocusCapture={() => { navFocused.current = true }}
        onBlurCapture={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) navFocused.current = false }}>
        {portrait ? <label className={styles.mobileSelect}>章节
          <select aria-label="选择教程章节" value={topic} onChange={event => onTopicChange(event.target.value as HelpTopic)}>
            {HELP_TOPIC_GROUPS.map(group => <optgroup key={group.label} label={group.label}>{group.topics.map(item => <option key={item} value={item}>{getHelpTopicTitle(item)}</option>)}</optgroup>)}
          </select>
        </label> : <nav className={styles.directory} aria-label="教程目录">
          {HELP_TOPIC_GROUPS.map(group => <div key={group.label} className={styles.directoryGroup}>
            <h4>{group.label}</h4>
            {group.topics.map(item => <button key={item} type="button" aria-pressed={topic === item} onClick={() => onTopicChange(item)}>
              <span aria-hidden="true">{String(HELP_TOPIC_ORDER.indexOf(item) + 1).padStart(2, '0')}</span>{getHelpTopicTitle(item)}
            </button>)}
          </div>)}
        </nav>}
      </div>
      <article ref={articleRef} className={styles.article} aria-labelledby={`${id}-chapter`}>
        <div className={styles.articleInner}>
          <header className={styles.chapterHeader}>
            <span className={styles.chapterNumber}>第 {topicIndex + 1} 章 · 共 {HELP_TOPIC_ORDER.length} 章</span>
            <h2 id={`${id}-chapter`}>{getHelpTopicTitle(topic)}</h2>
          </header>
          {sections.length > 3 && <nav className={styles.sectionLinks} aria-label="本章内容">
            {sections.map((section, index) => <button key={`${section.title}-${index}`} type="button" onClick={() => navigateSection(index)}>{section.title}</button>)}
          </nav>}
          {sections.map((section, index) => <section key={`${topic}-${index}`} className={styles.section}>
            <h3 data-section-index={index} tabIndex={-1}>{section.title}</h3>
            {section.collapsed ? <details className={styles.referenceDetails}><summary>展开参考文献</summary><div className={styles.manualText} dangerouslySetInnerHTML={{ __html: sectionHtml(section) }} /></details> : <>
              {section.questions ? <ol className={styles.quizList} aria-label={`${section.title}问答`}>
                {section.questions.map(item => <li key={item.question}><details className={styles.quiz} data-review-question>
                  <summary>{item.question}<span className={styles.answerCue}>查看答案</span></summary>
                  <p className={styles.answer}>{item.answer}</p>
                </details></li>)}
              </ol> : section.html ? <div className={styles.manualText} dangerouslySetInnerHTML={{ __html: sectionHtml(section) }} /> : section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.steps && <ol className={styles.steps}>{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}
              {section.visualization === 'source-filter' && <SourceFilterLab />}
              {section.visualization === 'vowel-map' && <VowelMap />}
              {section.visualization === 'chart-reading' && <ChartReadingExample />}
              {section.anatomyFocus && (topic === 'anatomy' ? <AnatomyExplorer initialFocus={section.anatomyFocus} /> : <details className={styles.anatomyDetails}>
                <summary>查看相关发声部位</summary><AnatomyExplorer initialFocus={section.anatomyFocus} />
              </details>)}
            </>}
          </section>)}
          {topic === 'targets' && <div className={styles.tableWrap}><table className={styles.refTable}>
            <caption>默认目标中心与窗口（Hz）</caption>
            <thead><tr>{['元音', 'F0 中心 ±40', 'F1 中心 ±100', 'F2 中心 ±150'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>{getPresetRows().map(row => <tr key={row.vowel}><th scope="row">{row.vowel}</th>{row.ranges.map((range, index) => <td key={index}>{(range[0] + range[1]) / 2}<small> ±{TARGET_HALF_WIDTH_HZ[(['f0', 'f1', 'f2'] as const)[index]]}</small></td>)}</tr>)}</tbody>
          </table></div>}
          <nav className={styles.related} aria-label="前后章节">
            {getRelatedHelpTopics(topic).map(item => <button type="button" key={item} onClick={() => onTopicChange(item)}>
              <small>{HELP_TOPIC_ORDER.indexOf(item) < topicIndex ? '上一章' : '下一章'}</small>{getHelpTopicTitle(item)}
            </button>)}
          </nav>
          <footer className={styles.articleFooter}><span>正文与插图依据 Aoi《MTF 声音女性化练习手册》整理。</span><a href={`${MANUAL_BASE}index.html`} target="_blank" rel="noreferrer">MTF 手册原文（离线）</a></footer>
        </div>
      </article>
    </div>
  </Modal>
}
