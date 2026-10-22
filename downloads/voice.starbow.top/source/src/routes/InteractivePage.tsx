import { Link } from 'react-router-dom'
import { AnatomyExplorer } from '../components/AnatomyExplorer'
import styles from './InteractivePage.module.css'

export function InteractivePage() {
  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.header}>
        <div><h1 className="page-title">从发声动作，到元音与共振</h1><p className={styles.lead}>选择元音，拖动滑块或图中的实心点，观察结构与声音一起变化；悬停发声部位可查看对应结构。</p></div>
        <Link to="/manual">阅读教学文档 <span aria-hidden="true">↗</span></Link>
      </header>
      <AnatomyExplorer />
      <footer className={styles.footer}><Link to="/">回到声音分析 →</Link></footer>
    </div>
  </main>
}
