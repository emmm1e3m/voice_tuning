import { FrameworkArt } from './larynxFrameworkArt'

interface MuscleProps { id: string; name: string; d: string; fibers: string[]; deep?: boolean }

function Muscle({ id, name, d, fibers, deep = false }: MuscleProps) {
  return <g>
    <clipPath id={`${id}-${name}`}><path d={d} /></clipPath>
    <path d={d} fill={`url(#${id}-${deep ? 'deep' : 'muscle'})`} stroke={deep ? '#a97670' : '#a86965'} strokeWidth="1.1" />
    <g clipPath={`url(#${id}-${name})`} fill="none" strokeLinecap="round">
      {fibers.map((fiber, index) => <path key={index} d={fiber} stroke={index % 3 === 0 ? '#ffe1c5' : '#965453'} strokeWidth={index % 3 === 0 ? .85 : .65} opacity={index % 3 === 0 ? .65 : .4} />)}
    </g>
  </g>
}

// 正面浅层解剖：面肌向口角汇聚，颈肌跨越舌骨与喉的骨性、软骨性支架。
export function AnteriorFaceArt({ id }: { id: string }) {
  const many = (n: number, make: (t: number, i: number) => string) => Array.from({ length: n }, (_, i) => make(i / (n - 1), i))
  const bone = `url(#${id}-bone)`
  return <g>
    <defs>
      <linearGradient id={`${id}-muscle`} x1="0" x2="1" y1="0" y2=".3"><stop stopColor="#ad6967" /><stop offset=".2" stopColor="#ce8a80" /><stop offset=".5" stopColor="#e3ab98" /><stop offset=".77" stopColor="#c48078" /><stop offset="1" stopColor="#9e5f5e" /></linearGradient>
      <linearGradient id={`${id}-deep`} x1="0" x2="1" y1="0" y2=".3"><stop stopColor="#a46663" /><stop offset=".38" stopColor="#cd9685" /><stop offset=".6" stopColor="#ddb09a" /><stop offset="1" stopColor="#aa726a" /></linearGradient>
      <linearGradient id={`${id}-bone`} x1="0" x2=".3" y1="0" y2="1"><stop stopColor="#fff9e9" /><stop offset=".4" stopColor="#e8d7b7" /><stop offset=".65" stopColor="#fff2d7" /><stop offset="1" stopColor="#c9b18a" /></linearGradient>
      <linearGradient id={`${id}-skin`} x1="0" x2="1" y1="0" y2=".7"><stop stopColor="#d9b6a3" /><stop offset=".4" stopColor="#f4dfcc" /><stop offset=".7" stopColor="#e8c8b2" /><stop offset="1" stopColor="#b88876" /></linearGradient>
      <linearGradient id={`${id}-lip`} x1="0" x2=".1" y1="0" y2="1"><stop stopColor="#bc7a75" /><stop offset=".24" stopColor="#dd9b90" /><stop offset=".5" stopColor="#a85e61" /><stop offset=".7" stopColor="#e4a79a" /><stop offset="1" stopColor="#bf7f78" /></linearGradient>
      <linearGradient id={`${id}-tendon`} x1="0" x2="1"><stop stopColor="#c7b49e" /><stop offset=".45" stopColor="#fff2db" /><stop offset="1" stopColor="#e2cfb1" /></linearGradient>
      <radialGradient id={`${id}-neck`} cx=".5" cy=".4" r=".7"><stop stopColor="#f2e5d4" /><stop offset=".63" stopColor="#d8c3b0" /><stop offset="1" stopColor="#f3e9de" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-noseShade`} cx=".48" cy=".4" r=".62"><stop stopColor="#f7dfc9" /><stop offset=".55" stopColor="#d6a18b" /><stop offset="1" stopColor="#a77366" /></radialGradient>
    </defs>

    {/* 颈部深层与两侧斜角肌，先于浅层条带肌绘制。 */}
    <path d="M115 222C124 280 127 344 109 423C94 491 67 561 35 631C80 668 151 698 260 700C369 698 440 668 485 631C453 561 426 491 411 423C393 344 396 280 405 222Z" fill={`url(#${id}-neck)`} />
    {[false, true].map(mirror => <g key={`deep-neck-${mirror}`} transform={mirror ? 'translate(520 0) scale(-1 1)' : undefined}>
      <Muscle id={id} name={`scalene-${mirror}`} deep d="M131 256C143 306 143 361 132 416C118 488 90 561 67 621C85 640 106 653 126 659C137 587 160 515 170 448C182 369 162 301 145 255Z" fibers={many(21, t => `M${134 + t * 11} ${261 + t * 2}C${174 + t * 10} 391 ${113 + t * 28} 539 ${72 + t * 48} ${621 + t * 29}`)} />
      <Muscle id={id} name={`deep-sternothyroid-${mirror}`} deep d="M223 447C219 484 217 537 220 589C222 624 226 657 226 681L245 687C248 643 248 604 245 564C243 516 243 480 240 448Z" fibers={many(12, t => `M${225 + t * 13} 449C${225 + t * 17} 523 ${231 + t * 12} 602 ${229 + t * 12} 684`)} />
    </g>)}
    <path d="M164 246C181 272 198 306 222 331Q260 342 298 331C322 306 339 272 356 246Q260 217 164 246Z" fill={`url(#${id}-deep)`} stroke="#ae726c" strokeWidth="1" />
    {many(39, t => `M${170 + t * 180} ${248 - Math.sin(t * Math.PI) * 17}C${190 + t * 140} 276 ${218 + t * 84} 316 ${226 + t * 68} ${330 + Math.sin(t * Math.PI) * 4}`).map((d, i) => <path key={`floor-${i}`} d={d} fill="none" stroke={i % 3 ? '#8b504d' : '#efd0b5'} strokeWidth=".8" opacity=".45" />)}

    <g transform="translate(136 276) scale(.62)"><FrameworkArt id={`${id}-framework`} /></g>
    <path d="M229 622C227 640 229 659 231 677Q260 686 289 677C291 659 293 640 291 622Z" fill="#e4e9de" stroke="#9dafa9" strokeWidth="1" />
    {[632, 648, 664].map(y => <g key={y}><path d={`M230 ${y}Q260 ${y + 8} 290 ${y}V${y + 10}Q260 ${y + 20} 230 ${y + 10}Z`} fill="#bad0d4" stroke="#8ca8b1" strokeWidth="1" /><path d={`M232 ${y + 2}Q260 ${y + 10} 288 ${y + 2}`} fill="none" stroke="#edf7f3" strokeWidth="1" /></g>)}

    {/* 左右胸锁乳突肌从乳突区向胸骨柄及锁骨内段汇聚。 */}
    {[false, true].map(mirror => <g key={`neck-${mirror}`} transform={mirror ? 'translate(520 0) scale(-1 1)' : undefined}>
      <Muscle id={id} name={`sternocleidomastoid-${mirror}`} d="M101 203C111 210 121 224 126 245C136 284 145 330 151 375C163 464 183 553 223 671C225 680 219 688 211 688L194 683C168 629 153 574 136 519C116 450 102 386 96 327C91 276 91 235 101 203Z" fibers={many(25, t => `M${100 + t * 20} ${211 + t * 30}C${94 + t * 42} ${322 + t * 51} ${137 + t * 44} ${520 + t * 23} ${198 + t * 22} ${680 + t * 3}`)} />
      <Muscle id={id} name={`clavicular-head-${mirror}`} deep d="M120 345C136 396 147 463 160 513C175 568 194 617 204 655C194 664 177 669 159 665C151 638 144 607 137 576C121 505 110 425 112 367Z" fibers={many(16, t => `M${114 + t * 12} ${366 + t * 35}C${120 + t * 17} 449 ${145 + t * 23} 576 ${161 + t * 38} 662`)} />
      <Muscle id={id} name={`sternohyoid-${mirror}`} d="M217 339C211 375 213 418 215 459C217 512 212 559 207 606C204 635 204 658 207 679L223 685C228 651 230 621 233 585C236 545 237 506 236 466C235 421 236 376 232 340Z" fibers={many(14, t => `M${219 + t * 11} 340C${215 + t * 18} 431 ${230 + t * 10} 512 ${219 + t * 11} 603Q${209 + t * 16} 651 ${210 + t * 11} 680`)} />
      <Muscle id={id} name={`thyrohyoid-${mirror}`} deep d="M221 340C220 361 218 383 217 402L234 411C235 383 236 360 234 341Z" fibers={many(11, t => `M${223 + t * 10} 341Q${218 + t * 17} 370 ${220 + t * 13} ${402 + t * 7}`)} />
      <Muscle id={id} name={`cricothyroid-${mirror}`} deep d="M230 500C229 510 230 524 237 535Q247 538 254 533L250 512Z" fibers={many(11, t => `M${232 + t * 14} ${502 + t * 9}Q${235 + t * 11} 523 ${239 + t * 13} ${534 - t * 2}`)} />
      <path d="M202 674C174 663 152 662 132 660C108 658 84 650 60 652C48 655 48 668 61 672C83 674 104 681 130 682C158 681 180 689 203 696Z" fill={bone} stroke="#b6a080" strokeWidth="1.1" />
      <path d="M62 657C85 660 106 667 132 666C153 668 174 671 199 679" fill="none" stroke="#fff9e4" strokeWidth="2" strokeLinecap="round" />
    </g>)}
    <path d="M226 679Q241 671 260 675Q279 671 294 679L302 713H218Z" fill={bone} stroke="#b6a080" strokeWidth="1.1" />
    <path d="M232 681Q260 688 288 681" fill="none" stroke="#fff9e8" strokeWidth="2" />

    {/* 面部筋膜填充肌束之间的间隙；保留各肌束的独立外缘。 */}
    <path d="M107 13C145 7 195 8 232 18H288C325 8 375 7 413 13C424 72 423 137 412 191C406 221 390 245 365 259C335 277 296 282 260 282C224 282 185 277 155 259C130 245 114 221 108 191C97 137 96 72 107 13Z" fill="#e1c4ae" stroke="#c8a88e" strokeWidth=".8" />
    <path d="M121 26C159 20 194 31 222 62M299 62C327 31 362 20 400 26" fill="none" stroke="#f4dfc5" strokeWidth="10" strokeLinecap="round" strokeOpacity=".6" />

    {/* 下颌骨在口底下缘显露，外侧由咬肌覆盖。 */}
    <path d="M97 131C96 181 109 226 143 254C169 275 207 291 260 291C313 291 351 275 377 254C411 226 424 181 423 131L399 134C400 181 387 213 360 235C335 253 300 263 260 263C220 263 185 253 160 235C133 213 120 181 121 134Z" fill={bone} stroke="#baa489" strokeWidth="1.2" />
    <path d="M122 217C148 258 200 280 260 280C320 280 372 258 398 217" fill="none" stroke="#fff7e5" strokeWidth="3" />
    {many(27, t => `M${147 + t * 226} ${256 + Math.sin(t * Math.PI) * 26}l2 -5`).map((d, i) => <path key={`mandible-${i}`} d={d} fill="none" stroke="#b29b79" strokeWidth=".65" opacity=".32" />)}

    {[false, true].map(mirror => <g key={`face-${mirror}`} transform={mirror ? 'translate(520 0) scale(-1 1)' : undefined}>
      <path d="M89 35C75 31 69 44 70 66C69 80 68 97 75 112C81 123 91 119 98 108L111 72Z" fill={`url(#${id}-skin)`} stroke="#c7a58f" strokeWidth="1" />
      <path d="M85 48C77 52 78 65 81 72C87 70 91 72 92 79C89 84 82 90 84 99" fill="none" stroke="#af7f70" strokeWidth="2" strokeLinecap="round" />
      <Muscle id={id} name={`masseter-${mirror}`} deep d="M106 62C120 64 139 78 150 95C154 124 157 154 163 182C166 206 158 224 146 236C130 228 119 213 114 192C104 152 100 112 106 62Z" fibers={many(25, t => `M${108 + t * 39} ${67 + t * 28}C${107 + t * 40} 121 ${121 + t * 37} 187 ${141 + t * 14} ${231 - t * 15}`)} />
      <Muscle id={id} name={`buccinator-${mirror}`} deep d="M117 118C141 124 164 133 185 145L189 181C164 189 143 187 123 171C118 156 116 136 117 118Z" fibers={many(18, t => `M119 ${121 + t * 49}Q151 ${141 + t * 41} 187 ${147 + t * 30}`)} />
      <Muscle id={id} name={`zygomaticus-${mirror}`} d="M116 29C137 35 164 59 182 81C197 101 207 121 211 141L193 155C184 139 174 124 160 108C140 87 123 65 111 43Z" fibers={many(17, t => `M${114 + t * 10} ${33 + t * 4}C${130 + t * 18} ${62 + t * 16} ${175 + t * 14} ${110 + t * 18} ${196 + t * 12} ${151 - t * 11}`)} />
      <Muscle id={id} name={`zygomaticus-minor-${mirror}`} d="M170 16C184 25 195 44 202 65C213 91 219 112 220 134L208 138C204 120 196 102 186 85C173 63 164 40 165 22Z" fibers={many(11, t => `M${168 + t * 6} ${21 + t * 2}C${172 + t * 20} 54 ${204 + t * 10} 101 ${211 + t * 7} 135`)} />
      <Muscle id={id} name={`risorius-${mirror}`} d="M105 159C131 159 154 161 181 159L190 171C167 187 137 192 116 182C109 178 106 168 105 159Z" fibers={many(13, t => `M107 ${161 + t * 16}Q142 ${171 + t * 19} 185 ${162 + t * 12}`)} />
      <Muscle id={id} name={`depressor-angle-${mirror}`} d="M185 179C180 199 166 220 154 242C169 257 185 268 204 271C208 248 207 221 200 196Z" fibers={many(15, t => `M${187 + t * 10} ${185 + t * 10}Q${193 + t * 18} 226 ${158 + t * 43} ${243 + t * 25}`)} />
      <Muscle id={id} name={`depressor-lip-${mirror}`} d="M209 206C216 223 226 234 242 241L243 277C224 278 209 272 195 261C200 239 207 222 209 206Z" fibers={many(13, t => `M${211 + t * 28} ${211 + t * 21}Q${211 + t * 23} 244 ${200 + t * 41} ${260 + t * 15}`)} />
      <Muscle id={id} name={`mentalis-${mirror}`} d="M244 224C232 230 231 250 237 264C240 272 248 276 257 275L257 232Z" fibers={many(10, t => `M${245 + t * 11} 230Q${233 + t * 20} 254 ${242 + t * 14} 273`)} />
      <path d="M235 24C224 55 225 88 228 117L244 132L250 106L250 20Z" fill={`url(#${id}-muscle)`} stroke="#bd8176" strokeWidth=".8" />
      {many(10, t => `M${235 + t * 10} 27Q${225 + t * 21} 76 ${233 + t * 11} 118`).map((d, i) => <path key={`nasal-${i}`} d={d} fill="none" stroke={i % 3 ? '#9d5e59' : '#f1c6aa'} strokeWidth=".7" opacity=".4" />)}
    </g>)}

    {/* 口轮匝肌绕口裂连续分布，唇红缘覆盖其中央表面。 */}
    <path d="M173 149C188 127 214 119 237 123C246 119 252 118 260 121C268 118 274 119 283 123C306 119 332 127 347 149C356 162 359 179 352 192C344 209 321 222 293 224Q260 233 227 224C199 222 176 209 168 192C161 179 164 162 173 149Z" fill={`url(#${id}-muscle)`} stroke="#aa6965" strokeWidth="1.2" />
    {many(19, t => `M${170 + t * 10} ${171 + t * 24}C${183 + t * 8} ${130 + t * 9} ${218 + t * 3} ${124 + t * 10} 260 ${128 + t * 9}C${302 - t * 3} ${124 + t * 10} ${337 - t * 8} ${130 + t * 9} ${350 - t * 10} ${171 + t * 24}`).map((d, i) => <path key={`orbicular-upper-${i}`} d={d} fill="none" stroke={i % 3 ? '#9f5a57' : '#f9d0b2'} strokeWidth=".7" opacity=".5" />)}
    {many(18, t => `M${172 + t * 17} ${180 + t * 8}C${190 + t * 4} ${218 - t * 2} ${223 + t * 4} ${225 - t * 9} 260 ${225 - t * 10}C${297 - t * 4} ${225 - t * 9} ${330 - t * 4} ${218 - t * 2} ${348 - t * 17} ${180 + t * 8}`).map((d, i) => <path key={`orbicular-lower-${i}`} d={d} fill="none" stroke={i % 3 ? '#995855' : '#fbd5b7'} strokeWidth=".7" opacity=".5" />)}
    <path d="M183 173C200 162 218 158 236 160Q250 153 260 158Q270 153 284 160C302 158 320 162 337 173C316 180 295 181 279 180Q260 182 241 180C225 181 204 180 183 173Z" fill={`url(#${id}-lip)`} stroke="#9d635f" strokeWidth=".9" />
    <path d="M183 174C208 175 229 172 247 174Q260 171 273 174C291 172 312 175 337 174C321 189 299 198 277 198H243C221 198 199 189 183 174Z" fill={`url(#${id}-lip)`} stroke="#a46b63" strokeWidth=".9" />
    <path d="M183 174C204 175 225 172 245 174Q260 176 275 174C295 172 316 175 337 174" fill="none" stroke="#784a49" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M199 185Q226 196 257 193M263 193Q294 196 321 185" fill="none" stroke="#f6c0ad" strokeWidth="1.2" strokeOpacity=".7" />
    {many(26, t => `M${199 + t * 122} ${182 + Math.sin(t * Math.PI) * 5}l${(t - .5) * 3} 7`).map((d, i) => <path key={`lip-${i}`} d={d} fill="none" stroke="#a16a63" strokeWidth=".6" opacity=".32" />)}
    <path d="M243 120Q260 125 277 120L275 143Q260 147 245 143Z" fill={`url(#${id}-skin)`} stroke="#d0a18a" strokeWidth=".7" />
    <path d="M255 124L253 141M265 124L267 141" fill="none" stroke="#bd8d79" strokeWidth=".9" />

    {/* 鼻翼和鼻孔作为面部定向参照，鼻根裁在画幅之外。 */}
    <path d="M241 5C240 27 239 46 231 63C224 76 220 88 226 101C232 113 243 114 250 111Q260 118 270 111C277 114 288 113 294 101C300 88 296 76 289 63C281 46 280 27 279 5Z" fill={`url(#${id}-noseShade)`} stroke="#bf8b76" strokeWidth="1.1" />
    <path d="M246 11C245 35 243 56 239 71Q260 62 281 71C277 56 275 35 274 11" fill="#f0cbb1" fillOpacity=".55" />
    <path d="M228 94C231 85 241 85 247 93L247 103C238 108 229 106 228 100ZM292 94C289 85 279 85 273 93L273 103C282 108 291 106 292 100Z" fill="#714b44" />
    <path d="M248 95Q260 86 272 95L270 108Q260 114 250 108Z" fill={`url(#${id}-skin)`} stroke="#c58e77" strokeWidth=".7" />
    <path d="M230 91Q238 84 246 92M274 92Q282 84 290 91" fill="none" stroke="#d7a78d" strokeWidth="1.2" />
  </g>
}
