import { useId } from 'react'
import { ANATOMY_VOWELS } from '../utils/anatomyAcoustics'
import { VocalTractDiagram } from './VocalTractDiagram'
import { AnteriorFaceArt } from './anatomyAnteriorArt'
import { SuperiorAirwayArt } from './anatomySuperiorArt'
import styles from './AnatomyPlate.module.css'

// 分开呈现三个观察方向，保留完整的解剖层次与可读标注。
export function AnatomyPlate() {
  const id = `anatomy-plate-${useId().replace(/:/g, '')}`
  return <div className={styles.plate}>
    <section className={styles.view} aria-labelledby={`${id}-sagittal`}>
      <header><h4 id={`${id}-sagittal`}>声道与头颈结构</h4><p>矢状剖视 · 前方在右</p></header>
      <p className={styles.scrollHint}>左右滑动查看完整解剖图与标注</p>
      <div className={`${styles.scrollCanvas} ${styles.sagittal}`} tabIndex={0} role="region" aria-label="声道与头颈矢状面，可左右滚动">
        <VocalTractDiagram position={ANATOMY_VOWELS['vowel-a'].position} />
      </div>
    </section>

    <section className={styles.view} aria-labelledby={`${id}-anterior-heading`}>
      <header><h4 id={`${id}-anterior-heading`}>面部、口底与喉的连接</h4><p>前面观 · 显露面部及部分颈肌</p></header>
      <p className={styles.scrollHint}>左右滑动查看肌肉、骨与软骨的层次</p>
      <div className={styles.scrollCanvas} tabIndex={0} role="region" aria-label="面颈部前视解剖图，可左右滚动">
        <svg className={styles.viewSvg} viewBox="0 0 900 800" role="img" aria-labelledby={`${id}-anterior-title ${id}-anterior-desc`}>
          <title id={`${id}-anterior-title`}>面部表情肌、口底及喉部的前面观</title>
          <desc id={`${id}-anterior-desc`}>口轮匝肌环绕嘴唇，颧肌斜行到口角，咬肌覆盖下颌支。下颌舌骨肌构成口底，舌骨悬于下颌下方并连接喉部。甲状软骨下接环状软骨与气管；颈前条带肌和胸锁乳突肌在两侧展开。</desc>
          <g transform="translate(190 28)"><AnteriorFaceArt id={`${id}-anterior`} /></g>
          <g className={styles.leader}>
            <path d="M350 120 240 116H28M365 194 238 210H28M352 286 237 316H28M404 331 237 385H28M337 503 238 509H28M413 601 236 624H28" />
            <path d="M578 163 651 143H712M552 173 650 222H712M450 368H712M472 481 651 459H712M450 568 650 569H712M450 634 651 649H712" />
          </g>
          <g className={styles.labels}>
            <text x="28" y="107">颧肌</text><text x="28" y="201">口轮匝肌</text><text x="28" y="307">下颌骨</text><text x="28" y="376">下颌舌骨肌</text><text x="28" y="500">胸锁乳突肌</text><text x="28" y="615">胸骨舌骨肌</text>
            <text x="720" y="134">咬肌</text><text x="720" y="213">颊肌</text><text x="720" y="356">舌骨</text><text x="720" y="450">甲状软骨</text><text x="720" y="560">环状软骨</text><text x="720" y="640">气管</text>
          </g>
          <text className={styles.footnote} x="450" y="778" textAnchor="middle">舌骨联系口底、舌与喉；颈前肌群支持喉部的升降与稳定。</text>
        </svg>
      </div>
    </section>

    <section className={styles.view} aria-labelledby={`${id}-superior-heading`}>
      <header><h4 id={`${id}-superior-heading`}>从上方观察咽喉与声门</h4><p>上方观 · 前方在上</p></header>
      <p className={styles.scrollHint}>左右滑动查看声带及周围结构</p>
      <div className={styles.scrollCanvas} tabIndex={0} role="region" aria-label="咽喉与声门的上方观，可左右滚动">
        <svg className={styles.viewSvg} viewBox="0 0 900 700" role="img" aria-labelledby={`${id}-superior-title ${id}-superior-desc`}>
          <title id={`${id}-superior-title`}>舌根、会厌、喉入口、声带及后方颈椎的空间关系</title>
          <desc id={`${id}-superior-desc`}>前方在上，后方在下。移除覆盖组织以展开不同深度的结构：舌根位于会厌前方，咽壁环绕喉入口；左右真声带从前连合向后分开，后端附着于成对杓状软骨，中央围成声门。食管在喉后方，颈椎更靠后。</desc>
          <g transform="translate(190 38)"><SuperiorAirwayArt id={`${id}-superior`} /></g>
          <g className={styles.leader}>
            <path d="M406 176 240 102H28M464 219H28M434 366 240 368H28M450 481 238 506H28" />
            <path d="M595 310 654 244H712M450 376 653 337H712M486 421 653 432H712M450 515 653 583H712" />
          </g>
          <g className={styles.labels}>
            <text x="28" y="93">舌根</text><text x="28" y="210">会厌</text><text x="28" y="359">声带游离缘</text><text x="28" y="497">食管</text>
            <text x="720" y="235">咽壁</text><text x="720" y="328">声门</text><text x="720" y="423">杓状软骨</text><text x="720" y="574">颈椎</text>
          </g>
          <text className={styles.footnote} x="450" y="674" textAnchor="middle">分层显露喉入口与声门；不同深度的组织在此视图中展开呈现。</text>
        </svg>
      </div>
    </section>
  </div>
}
