import { useId } from 'react'
import { FrameworkArt } from './larynxFrameworkArt'
import { IntrinsicArt } from './larynxIntrinsicArt'
import { ExtrinsicArt } from './larynxExtrinsicArt'
import styles from './LaryngealFigures.module.css'

export function LarynxFrameworkFigure() {
  const id = useId().replace(/:/g, '')
  return <div className={styles.figure}>
    <p className={styles.scrollHint}>左右滑动查看完整解剖图与标注</p>
    <div className={styles.scrollCanvas} tabIndex={0} role="region" aria-label="喉部支架图，可左右滚动">
      <svg viewBox="0 0 900 760" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>舌骨、喉软骨与气管的前视解剖图</title>
        <desc id={`${id}-desc`}>舌骨体及大角位于甲状软骨上方，以甲状舌骨膜连接。甲状软骨两翼在前方汇合成喉结，上缘中央有上切迹；后外侧有上下角。下方以环甲膜连接环状软骨，再接气管软骨前弓。左下横断面显示气管软骨呈C形，后方为膜性壁。</desc>
        <text className={styles.title} x="450" y="31" textAnchor="middle">喉部的骨性与软骨支架</text>
        <text className={styles.orientation} x="450" y="59" textAnchor="middle">前方观</text>
        <g transform="translate(230 72) scale(1.1)"><FrameworkArt id={`${id}-art`} /></g>
        <g className={styles.leader}>
          <path d="M410 190H267L234 170H49" /><path d="M391 270H267L234 280H49" /><path d="M368 492L262 462H49" /><path d="M424 496L265 531H49" />
          <path d="M556 269L618 248H675" /><path d="M532 362L624 351H675" /><path d="M508 545H675" /><path d="M504 647H675" />
        </g>
        <g className={styles.label}>
          <text x="49" y="161">舌骨体与大角</text><text x="49" y="271">甲状舌骨膜</text><text x="49" y="453">甲状软骨下角</text><text x="49" y="522">环甲膜／正中环甲韧带</text>
          <text x="683" y="240">甲状软骨上角</text><text x="683" y="343">甲状软骨翼板</text><text x="683" y="537">环状软骨前弓</text><text x="683" y="639">气管软骨前弓</text>
        </g>
        <g transform="translate(145 652)">
          <text className={styles.insetTitle} x="0" y="-48" textAnchor="middle">气管横断面</text>
          <path d="M-37 -24C-58 -6 -53 29 -29 43C-12 54 12 54 29 43C53 29 58 -6 37 -24L29 -16C44 0 39 22 22 32C9 40 -9 40 -22 32C-39 22 -44 0 -29 -16Z" fill="#c4d9de" stroke="#8aa5ae" strokeWidth="1.2" />
          <path d="M-36 -23Q0 -9 36 -23" fill="none" stroke="#b6a08f" strokeWidth="5" strokeLinecap="round" />
          <path d="M-35 -25Q0 -11 35 -25" fill="none" stroke="#e1d2bd" strokeWidth="2" />
          <text className={styles.microLabel} x="0" y="-64" textAnchor="middle">后方：膜性壁</text><text className={styles.microLabel} x="0" y="72" textAnchor="middle">前方：C 形软骨</text>
        </g>
        <text className={styles.footnote} x="450" y="746" textAnchor="middle">前视图显示软骨前弓；后方开放关系见横断面。</text>
      </svg>
    </div>
  </div>
}

export function ExtrinsicLarynxFigure() {
  const id = useId().replace(/:/g, '')
  return <div className={styles.figure}>
    <p className={styles.scrollHint}>左右滑动查看肌肉附着与标注</p>
    <div className={styles.scrollCanvas} tabIndex={0} role="region" aria-label="喉外肌群图，可左右滚动">
      <svg viewBox="0 0 900 870" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>喉外肌群的肌腹、肌腱及附着关系</title>
        <desc id={`${id}-desc`}>前下方观察。二腹肌前腹起于下颌内侧近中线，前后腹在舌骨旁中间腱汇合；下颌舌骨肌构成口底。图左保留浅层的胸骨舌骨肌及肩胛舌骨肌；图右移去部分浅肌，显露连接舌骨和甲状软骨的甲状舌骨肌，以及向下接胸骨的胸骨甲状肌。细线表示肌纤维走向。</desc>
        <text className={styles.title} x="450" y="29" textAnchor="middle">喉外肌群</text>
        <text className={styles.orientation} x="450" y="56" textAnchor="middle">前下方观 · 图左保留浅层，图右显露部分深层</text>
        <ExtrinsicArt id={`${id}-art`} />
        <g className={styles.leader}>
          <path d="M386 120L257 120L230 132H33" /><path d="M405 230L256 218H33" /><path d="M404 326H230L210 325H33" />
          <path d="M423 470L263 470H33" /><path d="M358 485L260 551H33" /><path d="M269 672L234 669H33" /><path d="M342 753L246 784H33" />
          <path d="M550 263L642 184H690" /><path d="M492 223L624 267H690" /><path d="M498 394H690" /><path d="M511 528L639 502H690" /><path d="M475 550L639 582H690" /><path d="M498 643L637 658H690" /><path d="M479 711L641 723H690" />
        </g>
        <g className={styles.label}>
          <text x="33" y="123">下颌骨</text><text x="33" y="209">下颌舌骨肌</text><text x="33" y="316">舌骨</text><text x="33" y="461">胸骨舌骨肌</text><text x="33" y="542">肩胛舌骨肌上腹</text><text x="33" y="660">肩胛舌骨肌下腹</text><text x="33" y="775">锁骨</text>
          <text x="698" y="175">二腹肌后腹</text><text x="698" y="258">二腹肌前腹</text><text x="698" y="385">甲状舌骨肌</text><text x="698" y="493">胸骨甲状肌</text><text x="698" y="573">环甲肌</text><text x="698" y="649">甲状腺</text><text x="698" y="714">气管</text>
        </g>
        <text className={styles.microLabel} x="698" y="201">上端通向颞骨乳突（后方）</text><text className={styles.microLabel} x="34" y="684">向肩胛骨延伸</text>
        <text className={styles.footnote} x="450" y="851" textAnchor="middle">舌骨连接口底、舌与喉的肌群；附着点决定各肌束的作用方向。</text>
      </svg>
    </div>
  </div>
}

export function IntrinsicLarynxFigure() {
  const id = useId().replace(/:/g, '')
  return <div className={styles.figure}>
    <p className={styles.scrollHint}>左右滑动查看喉内肌与软骨的层次</p>
    <div className={styles.scrollCanvas} tabIndex={0} role="region" aria-label="喉内肌上方观，可左右滚动">
      <svg viewBox="0 0 900 680" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>喉内肌的上方解剖图</title>
        <desc id={`${id}-desc`}>后方在上、前方在下。环杓后肌位于环状软骨后板上，环杓侧肌在其前外侧，横杓肌连接成对杓状软骨；甲杓肌沿声带外侧由甲状软骨前方延伸至杓状软骨。乳白色声带游离缘界定中央声门。</desc>
        <text className={styles.title} x="450" y="29" textAnchor="middle">喉内肌与声门</text><text className={styles.orientation} x="450" y="57" textAnchor="middle">上方观 · 后方在上</text>
        <g transform="translate(240 81)"><IntrinsicArt id={`${id}-art`} /></g>
        <g className={styles.leader}>
          <path d="M382 197L256 165H35" /><path d="M450 216L279 256H35" /><path d="M396 351L256 369H35" />
          <path d="M501 236L624 217H679" /><path d="M526 296L629 315H679" /><path d="M467 371L623 414H679" /><path d="M562 361L626 500H679" />
        </g>
        <g className={styles.label}>
          <text x="35" y="156">环杓后肌 PCA</text><text x="35" y="247">横杓肌（杓间肌）</text><text x="35" y="360">甲杓肌 TA</text>
          <text x="687" y="208">杓状软骨</text><text x="687" y="306">环杓侧肌 LCA</text><text x="687" y="405">声带游离缘</text><text x="687" y="491">甲状软骨</text>
        </g>
        <text className={styles.microLabel} x="35" y="182">外展声带，开大声门</text><text className={styles.microLabel} x="35" y="273">连接左右杓状软骨，参与内收</text><text className={styles.microLabel} x="35" y="386">声带外侧的肌性主体</text><text className={styles.microLabel} x="687" y="332">参与声带内收</text>
        <text className={styles.orientation} x="450" y="588" textAnchor="middle">前方 · 声带前连合</text>
        <path className={styles.leader} d="M450 529V568" />
        <text className={styles.footnote} x="450" y="636" textAnchor="middle">图中将覆盖组织移除，以显露喉内肌的起止与声带关系。</text>
        <text className={styles.footnote} x="450" y="660" textAnchor="middle">环甲肌位于喉的前外侧，上方视图中未显示。</text>
      </svg>
    </div>
  </div>
}
