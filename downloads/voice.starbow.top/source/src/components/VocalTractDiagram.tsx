import { useId, useState } from 'react'
import { isAnatomyPartRelevant, type AnatomyPosition, type AnatomyPositionKey } from '../utils/anatomyAcoustics'
import styles from './VocalTractDiagram.module.css'

interface VocalTractDiagramProps {
  position: AnatomyPosition
  active?: AnatomyPositionKey
  onActiveChange?: (part: AnatomyPositionKey | undefined) => void
  focus?: 'all' | 'f0' | 'f1' | 'f2'
}

type DiagramPart = AnatomyPositionKey | 'tongue' | 'skull' | 'nasal' | 'conchae' | 'palate' | 'softPalate' | 'pharynx' | 'epiglottis' | 'spine' | 'esophagus' | 'trachea' | 'hyoid'

const controlFor = (part: DiagramPart): AnatomyPositionKey | undefined => {
  if (part === 'tongue') return 'tongueHeight'
  if (part === 'hyoid') return 'larynx'
  if (['tension', 'larynx', 'tongueFront', 'tongueHeight', 'lips', 'jaw'].includes(part)) return part as AnatomyPositionKey
}

const unit = (value: number) => Math.max(0, Math.min(100, value))

// 舌面、牙列与口唇分别设定边界，极端元音位置仍留有连续的声道。
function geometry(position: AnatomyPosition) {
  const jaw = unit(position.jaw) * .34
  const front = 320 + unit(position.tongueFront) * .8
  const high = 318 - unit(position.tongueHeight) * .5 + jaw * .1
  const tip = 286 + jaw * .65 + (100 - unit(position.tongueHeight)) * .08
  const protrusion = unit(position.lips) * .14
  const upperLip = 274 + unit(position.lips) * .035
  const lowerLip = 295 + jaw * .7 - unit(position.lips) * .035
  const larynx = (50 - unit(position.larynx)) * .32
  const chin = 379 + jaw * .36
  const tongue = `M320 424 C294 418 281 401 280 377 C274 354 ${front - 70} ${high + 21} ${front - 35} ${high + 5} C${front - 16} ${high - 3} ${front + 8} ${high - 3} ${front + 32} ${high + 2} C${front + 50} ${high + 7} 438 ${tip - 4} 460 ${tip} Q469 ${tip + 4} 456 ${tip + 14} Q449 ${tip + 22} 448 ${lowerLip + 26} C414 ${375 + jaw * .28} 389 ${403 + jaw * .28} 359 420 Q340 431 320 424Z`
  const mandible = `M461 ${lowerLip + 13} L481 ${lowerLip + 13} Q489 ${lowerLip + 34} 479 ${chin - 4} Q468 ${chin + 14} 441 ${chin + 12} L421 ${chin + 5} 430 ${chin - 6} 452 ${chin - 2} Q464 ${chin - 4} 461 ${lowerLip + 13}Z`
  return { jaw, front, high, tip, protrusion, upperLip, lowerLip, larynx, chin, tongue, mandible }
}

export function VocalTractDiagram({ position, active, onActiveChange, focus = 'all' }: VocalTractDiagramProps) {
  const id = `tract-${useId().replace(/:/g, '')}`
  const [hovered, setHovered] = useState<DiagramPart>()
  const g = geometry(position)
  const highlighted = hovered ?? active
  const isHighlighted = (part: DiagramPart) => part === highlighted
    || (part === 'tongue' && (highlighted === 'tongueFront' || highlighted === 'tongueHeight'))
    || (part === 'hyoid' && highlighted === 'larynx')
    || (part === 'larynx' && highlighted === 'hyoid')
  const tongueFocused = isHighlighted('tongue')
  const larynxFocused = isHighlighted('larynx') || isHighlighted('tension')
  const interaction = (part: DiagramPart, relevant = focus === 'all', kind = 'structure') => ({
    'data-part': part,
    'data-kind': kind,
    'data-active': isHighlighted(part),
    'data-highlighted': isHighlighted(part),
    'data-relevant': relevant,
    onMouseEnter: () => { setHovered(part); onActiveChange?.(controlFor(part)) },
    onMouseLeave: () => { setHovered(undefined); onActiveChange?.(undefined) },
  })
  const annotation = (part: DiagramPart, name: string, x: number, y: number, leader: string, relevant = focus === 'all') => <g className={styles.annotation} {...interaction(part, relevant, 'annotation')}>
    <path className={styles.leaderHit} d={leader} />
    <path className={styles.leader} d={leader} />
    <text x={x} y={y}>{name}</text>
  </g>
  const foldTop = 521 - unit(position.tension) * .065
  const foldBottom = 579 + unit(position.tension) * .065
  const fibers = [
    [287, 378], [282, 359], [g.front - 46, g.high + 20], [g.front - 31, g.high + 8],
    [g.front - 14, g.high + 3], [g.front + 5, g.high + 3], [g.front + 24, g.high + 7],
    [g.front + 43, g.high + 13], [435, g.tip + 5], [453, g.tip + 10],
  ]
  const vocalFolds = <g className={`${styles.inset} ${styles.region}`} {...interaction('tension', isAnatomyPartRelevant('tension', focus))}>
        <rect x="512" y="490" width="244" height="175" rx="13" />
        <text className={styles.insetTitle} x="529" y="515">声带俯视</text><text className={styles.insetSmall} x="735" y="514" textAnchor="end">前</text>
        <g transform="translate(0 24)">
          <path className={styles.insetCartilage} fill={`url(#${id}-cartilage)`} d="M635 495C602 498 579 535 580 576Q582 606 635 610Q688 606 690 576C691 535 668 498 635 495Z" />
          <path className={styles.vestibule} d="M635 505C609 508 588 540 591 575Q595 595 635 598Q675 595 679 575C682 540 661 508 635 505Z" />
          <path className={styles.insetEpiglottis} d="M610 507Q635 488 660 507L657 516Q635 506 613 516Z" />
          <path className={styles.falseFold} d={`M627 ${foldTop}Q603 534 599 ${foldBottom - 9}L609 ${foldBottom - 5} 635 ${foldTop + 11} 661 ${foldBottom - 5} 671 ${foldBottom - 9}Q667 534 643 ${foldTop}Z`} />
          <path className={styles.glottis} d={`M635 ${foldTop + 2} 628 ${foldBottom}Q635 ${foldBottom + 4} 642 ${foldBottom}Z`} />
          <path className={styles.trueFoldUnderlay} d={`M635 ${foldTop + 2}Q630 547 628 ${foldBottom}M635 ${foldTop + 2}Q640 547 642 ${foldBottom}`} />
          <path className={styles.trueFold} data-focused={larynxFocused} d={`M635 ${foldTop + 2}Q630 547 628 ${foldBottom}M635 ${foldTop + 2}Q640 547 642 ${foldBottom}`} />
          <path className={styles.insetArytenoid} d={`M622 ${foldBottom - 2}Q612 ${foldBottom + 6} 621 ${foldBottom + 12}L631 ${foldBottom + 5}ZM648 ${foldBottom - 2}Q658 ${foldBottom + 6} 649 ${foldBottom + 12}L639 ${foldBottom + 5}Z`} />
          <path className={styles.insetLeader} d="M632 552 558 543M635 559H700" /><text className={styles.insetSmall} x="529" y="548">声带</text><text className={styles.insetSmall} x="706" y="564">声门</text>
          {highlighted === 'tension' && <path className={styles.motion} markerStart={`url(#${id}-motion)`} markerEnd={`url(#${id}-motion)`} d={`M570 ${foldTop + 3}V${foldBottom}`} />}
        </g>
        <text className={styles.insetSmall} x="529" y="652">左右声带围成声门</text>
      </g>
  return <figure className={styles.figure} data-focus={focus}>
    <svg className={styles.svg} viewBox="0 -80 650 770" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>发声器官矢状剖视与声带俯视图</title>
      <desc id={`${id}-desc`}>完整成人头颈矢状剖视，面部朝右，颅顶呈圆弧，枕部向后突出并收向颈后。鼻中隔透明显示鼻甲；口元音发声时软腭抬起，分隔鼻咽与口咽。舌体由下颌内侧向舌面呈扇形展开，舌根后方为咽腔。气管位于食管和颈椎前方。喉软骨与声带层面用侧方投影标明，成对声带在右下方俯视图中展开。</desc>
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2=".3"><stop stopColor="#f4f0eb" /><stop offset=".6" stopColor="#faf6f0" /><stop offset="1" stopColor="#efe1d8" /></linearGradient>
        <linearGradient id={`${id}-tongue`} x1=".15" y1="0" x2=".85" y2="1"><stop stopColor="#dba19f" /><stop offset=".48" stopColor="#d49698" /><stop offset="1" stopColor="#bf7d87" /></linearGradient>
        <linearGradient id={`${id}-muscle`} x1="0" y1="0" x2="1" y2=".5"><stop stopColor="#ead1c9" /><stop offset="1" stopColor="#cd9c99" /></linearGradient>
        <linearGradient id={`${id}-bone`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf1" /><stop offset="1" stopColor="#e4d5b9" /></linearGradient>
        <linearGradient id={`${id}-air`} x1="0" y1="1" x2=".7" y2="0"><stop stopColor="#e1f0f5" /><stop offset="1" stopColor="#f2f8fa" /></linearGradient>
        <linearGradient id={`${id}-cartilage`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#d9e1df" /><stop offset="1" stopColor="#adbfbd" /></linearGradient>
        <pattern id={`${id}-trabeculae`} width="9" height="10" patternUnits="userSpaceOnUse"><path d="M1 1 4 4 2 8M4 4 8 3M2 8 7 10" fill="none" stroke="#bba787" strokeWidth=".5" opacity=".5" /></pattern>
        <clipPath id={`${id}-tongueClip`}><path d={g.tongue} /></clipPath>
        <marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="#5a97b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <marker id={`${id}-motion`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 7 4 1 7Z" fill="#876ca5" /></marker>
      </defs>

      <g className={styles.orientation} transform="translate(-60 0)"><text x="176" y="-61">后方</text><path d="M218-67H438" /><text x="454" y="-61">前方</text></g>
      <g transform="translate(-60 0)">
        <path className={styles.skin} fill={`url(#${id}-skin)`} d={`M447 113 C447 62 431 14 389-13 C340-46 274-49 220-23 C166 3 135 49 126 105 C119 150 125 197 146 235 C157 254 171 267 184 276 Q177 296 179 326 L182 427 Q181 463 180 507 L173 628H410L396 448 Q389 421 390 ${g.chin + 30} Q393 ${g.chin + 11} 409 ${g.chin + 8} Q427 ${g.chin + 14} 448 ${g.chin + 14} Q470 ${g.chin + 10} 480 ${g.chin - 8} Q492 ${g.chin - 24} 482 ${g.lowerLip + 31} Q477 ${g.lowerLip + 23} 483 ${g.lowerLip + 12} Q${500 + g.protrusion} ${g.lowerLip + 2} ${482 + g.protrusion} ${g.lowerLip - 5} L${491 + g.protrusion} ${g.upperLip + 5} Q${504 + g.protrusion} ${g.upperLip - 1} ${490 + g.protrusion} ${g.upperLip - 9} L485 258 480 251 Q477 243 482 242 Q489 247 498 245 Q508 241 507 232 Q506 224 493 220 Q474 212 468 201 L456 177 Q457 166 465 162 Q471 155 466 151 Q460 146 458 132 Q451 123 447 113Z`} />

        <g className={styles.region} {...interaction('skull')}>
        <path className={styles.cranialSection} d="M151 110C161 57 195 15 243-7C288-28 344-25 386 2C416 21 433 62 434 109L431 136Q401 122 369 126Q337 128 315 152L291 169Q269 181 262 208L245 239 219 270Q184 258 166 224Q144 179 151 110Z" />
        <path className={styles.bone} fill={`url(#${id}-bone)`} fillRule="evenodd" d="M137 108C146 50 184 4 237-20C287-43 351-38 397-10C430 12 447 61 447 111L449 142 456 160 450 170 434 159Q411 139 378 140Q342 140 319 163L299 179Q279 190 276 214L258 245 225 283Q181 274 158 232Q131 184 137 108ZM151 110C161 57 195 15 243-7C288-28 344-25 386 2C416 21 433 62 434 109L431 136Q401 122 369 126Q337 128 315 152L291 169Q269 181 262 208L245 239 219 270Q184 258 166 224Q144 179 151 110Z" />
        <path className={styles.sinus} d="M428 107Q438 114 439 133L430 139 422 130Z" />
        <path className={styles.boneDetail} d="M438 153 450 165M320 152Q366 132 413 142M143 105C155 46 192 8 241-14M241-14C290-35 347-29 391-4" />
        <path className={styles.bone} fill={`url(#${id}-bone)`} d="M246 171Q274 153 304 153L324 163 312 185 292 183 278 210 254 209Z" />
        <path className={styles.sinus} d="M272 173Q285 166 301 170L303 179 286 180 278 193 267 192Z" />
        </g>
        <g className={`${styles.spine} ${styles.region}`} {...interaction('spine')}>
          <path className={styles.spinalCord} d="M210 285Q217 395 211 496L207 626" />
          <path className={styles.bone} fill={`url(#${id}-bone)`} d="M197 283Q217 275 241 283L246 291 242 299 231 296 231 288 207 288 205 297 194 297 188 290Z" />
          <path className={styles.bone} fill={`url(#${id}-bone)`} d="M222 313 224 290Q228 282 232 290L234 309 244 309 250 317 246 329 221 332 211 322 197 324 195 318 213 315Z" />
          <path className={styles.disc} d="M220 334 244 331 244 337 220 340Z" />
          {[0, 1, 2, 3, 4].map(index => {
            const y = 337 + index * 46
            return <g key={index} transform={`translate(${index > 2 ? -(index - 2) * 1.4 : 0} ${y})`}>
              <path className={styles.bone} fill={`url(#${id}-bone)`} d="M218 2 241 0Q252 5 249 18L243 28 219 31 211 22 199 24 197 18 213 13Z" />
              <path className={styles.boneTexture} fill={`url(#${id}-trabeculae)`} d="M220 7 239 5 244 11 240 23 222 25Z" />
              <path className={styles.disc} d="M219 34 242 31 243 39 219 42Z" />
              <path className={styles.boneDetail} d="M219 3 220 30M240 2 240 26" />
            </g>
          })}
        </g>
        <g className={styles.region} {...interaction('pharynx')}>
          <path className={styles.pharynxMuscle} d="M251 246Q238 314 251 380L273 440Q280 461 278 489L276 628" />
        </g>
        <g className={styles.region} {...interaction('nasal')}>
        <path className={styles.nasal} d="M269 246Q254 221 267 194Q279 164 315 158Q369 148 411 185L461 218Q481 226 480 239L464 244Q423 230 391 240L334 249Z" />
        <path className={styles.nasalFloor} d="M273 245Q327 232 389 239L466 246" />
        </g>
        <g className={`${styles.conchae} ${styles.region}`} {...interaction('conchae')}>
          <path d="M303 175Q327 161 349 173Q366 182 358 192Q350 201 334 190Q320 180 305 186Z" />
          <path d="M285 197Q327 179 372 197Q393 207 384 219Q373 230 351 216Q320 202 289 211Z" />
          <path d="M279 222Q323 206 381 222Q401 228 393 237Q385 245 359 233Q321 222 281 234Z" />
          <path className={styles.conchaRidge} d="M308 177Q334 168 351 184M292 201Q336 187 374 208M286 226Q335 213 381 231" />
        </g>
        <g className={styles.region} {...interaction('nasal')}>
          <path className={styles.septum} d="M283 174Q345 146 397 181L463 227Q428 219 399 231L304 243 273 239Q262 207 283 174Z" />
          <path className={styles.nasalCartilage} d="M454 181L474 208Q483 222 497 229M479 239Q489 233 499 238" />
        </g>
        <g className={styles.context}>
        <path className={styles.airway} fill={`url(#${id}-air)`} d={`M257 236Q293 243 318 248Q392 239 463 259L${492 + g.protrusion} ${g.upperLip + 3} L${488 + g.protrusion} ${g.lowerLip - 2} 453 ${g.lowerLip + 15} 406 ${386 + g.jaw * .3} 363 432Q349 452 350 ${476 + g.larynx}L351 628H313L313 ${488 + g.larynx}Q300 460 278 431Q250 387 247 331Q243 284 257 236Z`} />
        </g>
        <g className={styles.region} {...interaction('pharynx')}>
        <path className={styles.pharynxWall} d="M257 236Q243 285 247 331Q250 387 278 431" />
        </g>
        <g className={styles.region} {...interaction('palate')}>
        <path className={styles.maxilla} fill={`url(#${id}-bone)`} d="M278 246Q337 235 389 240Q432 242 468 251L481 270 470 281 461 270 458 261Q391 249 326 255L290 262Z" />
        <path className={styles.boneTexture} fill={`url(#${id}-trabeculae)`} d="M298 248Q374 238 449 253L446 257Q364 245 300 255Z" />
        <path className={styles.palateEdge} d="M315 254Q391 246 459 262" />
        <path className={styles.teeth} d="M467 260Q472 257 478 261L480 281Q476 287 468 283Z" />
        <path className={styles.toothRoot} d="M472 260 471 249 476 253 477 260" />
        </g>
        <g className={styles.region} {...interaction('softPalate')}>
        <path className={styles.softPalate} d="M317 246Q292 238 276 223Q264 216 252 225Q246 232 254 237Q281 251 309 258Z" />
        <path className={styles.uvula} d="M277 241Q275 251 282 256Q289 258 286 250L284 245" />
        </g>
        <g className={styles.region} {...interaction('lips', isAnatomyPartRelevant('lips', focus))}>
        <path className={styles.upperLip} data-focused={isHighlighted('lips')} d={`M479 259Q${489 + g.protrusion} ${g.upperLip - 10} ${497 + g.protrusion} ${g.upperLip - 2}Q${501 + g.protrusion} ${g.upperLip + 2} ${487 + g.protrusion} ${g.upperLip + 6}`} />
        <path className={styles.lowerLip} data-focused={isHighlighted('lips')} d={`M${486 + g.protrusion} ${g.lowerLip - 4}Q${501 + g.protrusion} ${g.lowerLip + 2} 483 ${g.lowerLip + 12}`} />
        <path className={styles.lipMucosa} d={`M475 265L${487 + g.protrusion} ${g.upperLip + 5}M${486 + g.protrusion} ${g.lowerLip - 3} 472 ${g.lowerLip + 8}`} />

        </g>
        <g className={styles.region} {...interaction('jaw', isAnatomyPartRelevant('jaw', focus) || isAnatomyPartRelevant('tongueFront', focus))}>
        <path className={styles.floorMuscle} fill={`url(#${id}-muscle)`} d={`M448 ${g.lowerLip + 27}Q422 ${g.chin + 2} 365 438L350 430 373 417Q420 ${g.chin - 12} 448 ${g.lowerLip + 27}Z`} />
        </g>
        <g className={styles.region} {...interaction('tongue', isAnatomyPartRelevant('tongueFront', focus) || isAnatomyPartRelevant('tongueHeight', focus))}>
        <path className={styles.tongue} fill={`url(#${id}-tongue)`} data-focused={tongueFocused} data-testid="anatomy-tongue" d={g.tongue} />
        <g className={styles.tongueFibers} clipPath={`url(#${id}-tongueClip)`} aria-hidden="true">
          {fibers.map(([x, y], index) => <path key={index} d={`M447 ${g.lowerLip + 27}Q${370 - index * 2} ${369 + index * 1.5} ${x} ${y}`} />)}
          <path className={styles.tongueFiberSecondary} d={`M316 419Q321 373 ${g.front + 12} ${g.high + 13}M335 423Q348 380 ${g.front + 33} ${g.high + 18}M354 424Q374 377 429 ${g.tip + 17}`} />
          <path className={styles.tongueSurface} d={`M285 368Q${g.front - 50} ${g.high + 18} ${g.front - 10} ${g.high + 4}Q${g.front + 25} ${g.high + 2} 447 ${g.tip + 3}`} />
        </g>
        </g>
        <g className={styles.region} {...interaction('jaw', isAnatomyPartRelevant('jaw', focus))}>
        <path className={styles.floorDetail} d={`M443 ${g.lowerLip + 31}Q412 ${g.chin + 4} 370 433M442 ${g.lowerLip + 38}Q406 ${g.chin + 9} 364 438`} />
        <path className={styles.bone} fill={`url(#${id}-bone)`} data-focused={isHighlighted('jaw')} d={g.mandible} />
        <path className={styles.boneTexture} fill={`url(#${id}-trabeculae)`} d={`M467 ${g.lowerLip + 24}H477Q482 ${g.lowerLip + 42} 471 ${g.chin - 2}Q458 ${g.chin + 7} 438 ${g.chin + 4}L441 ${g.chin - 1}Q470 ${g.chin + 2} 467 ${g.lowerLip + 24}Z`} />
        <path className={styles.teeth} d={`M463 ${g.lowerLip + 16} 475 ${g.lowerLip + 15} 477 ${g.lowerLip - 3}Q470 ${g.lowerLip - 7} 464 ${g.lowerLip - 3}Z`} />
        <path className={styles.toothRoot} d={`M466 ${g.lowerLip + 16} 470 ${g.lowerLip + 29} 473 ${g.lowerLip + 15}`} />
        <path className={styles.chinContour} d={`M484 ${g.lowerLip + 18}Q487 ${g.chin - 10} 468 ${g.chin + 1}`} />

        </g>
        <g className={styles.context}>
        <path className={styles.strapMuscle} fill={`url(#${id}-muscle)`} d={`M385 425Q366 459 367 487L385 628H369L352 484Q352 456 365 432Z`} />
        <path className={styles.strapFibers} d="M375 442Q358 480 377 621M380 440Q364 486 382 621M370 450Q355 490 371 620" />
        </g>
        <g className={styles.region} {...interaction('esophagus')}>
        <path className={styles.esophagus} d="M279 434Q289 454 284 482L282 628H296L298 482Q302 455 290 438" />
        <path className={styles.esophagusLumen} d="M285 452Q294 464 291 488L289 626" />

        </g>
        <g transform={`translate(0 ${g.larynx})`} data-focused={larynxFocused} data-testid="anatomy-larynx">
          <g className={styles.region} {...interaction('hyoid', isAnatomyPartRelevant('larynx', focus))}>
          <path className={styles.hyoid} fill={`url(#${id}-bone)`} d="M341 427Q352 431 366 424L373 427 367 435Q351 442 338 434Z" />
          <path className={styles.hyoidMembrane} d="M345 438 350 451M364 436 363 450" />
          </g>
          <g className={styles.region} {...interaction('epiglottis')}>
          <path className={styles.epiglottis} d="M349 462C340 440 324 419 307 402Q298 389 302 407C307 425 328 446 334 462Z" />
          </g>
          <g className={styles.region} {...interaction('larynx', isAnatomyPartRelevant('larynx', focus))}>
          <path className={styles.larynxWall} d="M311 446Q316 457 315 468L313 490 316 506H351L351 484Q355 459 349 445L342 442Q338 454 338 464L333 472 325 460 321 443Z" />
          <path className={styles.larynxLumen} d="M319 452Q329 467 331 474L337 471Q341 462 345 453L345 478Q344 489 346 505H320Q318 493 320 480Z" />
          <path className={styles.arytenoid} fill={`url(#${id}-cartilage)`} d="M313 465 319 455 325 466 322 474 315 473Z" />
          <path className={styles.thyroidCartilage} fill={`url(#${id}-cartilage)`} d="M348 441 354 433 358 448Q367 451 364 469L357 492 344 500 341 491Q353 472 350 455Z" />
          <path className={styles.cartilageDetail} d="M353 453Q360 465 350 487" />
          <path className={styles.cricoid} fill={`url(#${id}-cartilage)`} d="M315 502Q331 507 350 501L352 513Q333 521 314 514Z" />
          </g>
          <g className={styles.region} {...interaction('tension', isAnatomyPartRelevant('tension', focus))}>
          <path className={styles.vocalPlane} d="M320 479Q332 482 349 477" />
          </g>
        </g>
        <g className={styles.region} {...interaction('trachea')}>
        <path className={styles.trachea} d={`M316 ${520 + g.larynx}V629M350 ${519 + g.larynx}V629`} />
        {[0, 1, 2, 3, 4, 5].map(index => {
          const y = 529 + g.larynx + index * (94 - g.larynx) / 6
          return <path key={index} className={styles.trachealRing} d={`M317 ${y}Q333 ${y + 5} 349 ${y - 1}L350 ${y + 5}Q333 ${y + 10} 317 ${y + 6}Z`} />
        })}

        </g>
        <g className={styles.flow} markerEnd={`url(#${id}-arrow)`} aria-hidden="true">
          <path d={`M333 612V${529 + g.larynx}`} />
          <path d={`M330 ${502 + g.larynx}Q322 ${463 + g.larynx} 296 440Q266 404 262 354V314`} />
          <path d={`M267 295Q${g.front - 50} ${Math.max(262, g.high - 15)} ${g.front} ${Math.max(262, g.high - 15)}Q447 ${g.tip - 13} ${502 + g.protrusion} ${(g.upperLip + g.lowerLip) / 2}`} />
        </g>
      </g>

      <g className={styles.motion} transform="translate(-60 0)" markerStart={`url(#${id}-motion)`} markerEnd={`url(#${id}-motion)`} aria-hidden="true">
        {highlighted === 'tongueFront' && <path d={`M${g.front - 18} ${g.high + 28}H${g.front + 26}`} />}
        {highlighted === 'tongueHeight' && <path d={`M${g.front} ${g.high + 18}V${g.high + 54}`} />}
        {highlighted === 'larynx' && <path d={`M380 ${449 + g.larynx}V${491 + g.larynx}`} />}
        {highlighted === 'jaw' && <path d={`M498 ${g.chin - 18}V${g.chin + 15}`} />}
        {highlighted === 'lips' && <path d={`M${496 + g.protrusion} ${g.lowerLip + 32}H${528 + g.protrusion}`} />}
      </g>
      <g>
        {annotation('skull', '颅骨', 18, 26, 'M176-12 113 21H87')}
        {annotation('nasal', '鼻腔', 18, 174, 'M330 190 158 169H100')}
        {annotation('conchae', '鼻甲', 18, 220, 'M283 205 152 215H100')}
        {annotation('softPalate', '软腭', 18, 273, 'M225 245 149 268H100')}
        {annotation('pharynx', '咽腔', 18, 337, 'M197 332H100')}
        {annotation('tongue', '舌根', 18, 394, 'M228 384 150 389H100', isAnatomyPartRelevant('tongueFront', focus) || isAnatomyPartRelevant('tongueHeight', focus))}
        {annotation('epiglottis', '会厌', 18, 447, `M252 ${414 + g.larynx} 150 442H100`)}
        {annotation('spine', '颈椎', 18, 496, 'M175 491H100')}
        {annotation('esophagus', '食管', 18, 555, 'M229 550H100')}
        {annotation('trachea', '气管', 18, 606, 'M272 601H100')}
        {annotation('palate', '硬腭', 536, 256, 'M338 252 492 251H524')}
        {annotation('lips', '嘴唇', 536, 297, `M${435 + g.protrusion} ${(g.upperLip + g.lowerLip) / 2} 494 292H524`, isAnatomyPartRelevant('lips', focus))}
        {annotation('tongue', '舌面', 536, 333, `M${g.front - 50} ${g.high + 17} 493 328H524`, isAnatomyPartRelevant('tongueFront', focus) || isAnatomyPartRelevant('tongueHeight', focus))}
        {annotation('jaw', '下颌骨', 536, 382, `M409 ${g.chin - 3} 493 377H524`, isAnatomyPartRelevant('jaw', focus))}
        {annotation('hyoid', '舌骨', 536, 429, `M301 ${433 + g.larynx} 493 424H524`, isAnatomyPartRelevant('larynx', focus))}
        {annotation('larynx', '喉部', 536, 473, `M283 ${480 + g.larynx} 493 468H524`, isAnatomyPartRelevant('larynx', focus))}
      </g>
      <path className={styles.magnification} d={`M296 ${482 + g.larynx} 387 511`} />
      <g className={styles.desktopInset} transform="translate(-125 0)">{vocalFolds}</g>
      <g className={styles.legend} transform="translate(-60 0)"><circle cx="214" cy="660" r="5" fill="#a7cbd8" /><text x="227" y="665">气流</text></g>
    </svg>
    <svg className={styles.mobileInset} viewBox="506 485 256 188" role="img" aria-label="放大的声带俯视图：左右声带之间为声门">{vocalFolds}</svg>
    <figcaption>成人头颈矢状剖视 · 鼻中隔透明显示内部结构；喉软骨与声带层面作侧方投影。</figcaption>
  </figure>
}




