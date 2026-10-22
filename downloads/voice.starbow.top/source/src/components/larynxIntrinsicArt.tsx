// 上方观的形态按原喉内肌图重绘；肌束沿起止点走向，软骨面与声带游离缘分层绘制。
export function IntrinsicArt({ id }: { id: string }) {
  const leftThyroid = 'M80 22C72 17 67 23 69 36C75 62 80 91 76 114C72 132 63 149 63 172C60 204 69 238 82 268C102 319 126 370 156 412C176 441 194 465 210 477L213 446C188 425 169 398 153 369C132 333 116 292 105 253C94 215 93 184 102 155C107 138 105 122 101 104C96 84 95 61 91 42C89 31 86 24 80 22Z'
  const cricoid = 'M111 153C108 116 132 87 168 79C195 71 226 71 253 80C290 90 312 116 309 154C319 215 295 301 260 359C241 390 226 408 210 415C194 408 177 389 160 358C126 298 101 215 111 153ZM131 155C123 186 135 240 151 283C170 333 190 367 210 386C230 366 250 332 269 283C286 239 297 184 289 156C289 130 271 109 245 102C224 95 197 94 175 101C148 109 131 128 131 155Z'
  const pca = 'M166 80C150 80 134 89 124 103C115 117 111 136 116 150C126 160 142 158 154 150L173 139C173 128 168 115 170 103C171 94 177 82 166 80Z'
  const lca = 'M124 166C134 160 145 166 148 179C141 207 142 247 150 281C137 273 127 251 120 228C112 205 110 177 124 166Z'
  const ta = 'M148 177C156 177 167 181 176 185C177 232 178 285 185 335C191 381 199 416 210 443C198 445 187 429 178 410C162 375 152 329 146 279C141 236 140 191 148 177Z'
  const arytenoid = 'M154 129C165 124 175 130 177 142L175 151C180 158 187 167 184 174L176 183C167 178 158 175 151 175C140 175 131 170 126 165C121 159 127 154 135 153L141 151C148 143 145 134 154 129Z'
  return <g>
    <defs>
      <linearGradient id={`${id}-thyroid`} x1="0" y1=".3" x2="1" y2=".6"><stop stopColor="#dedad0" /><stop offset=".24" stopColor="#f8f4e9" /><stop offset=".6" stopColor="#e8e3d7" /><stop offset="1" stopColor="#b5b4aa" /></linearGradient>
      <linearGradient id={`${id}-cricoid`} x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#b0b9b3" /><stop offset=".26" stopColor="#e2e5da" /><stop offset=".58" stopColor="#f0eee3" /><stop offset="1" stopColor="#bdc5bb" /></linearGradient>
      <linearGradient id={`${id}-pca`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#557f71" /><stop offset=".3" stopColor="#8db09a" /><stop offset=".65" stopColor="#a5bea3" /><stop offset="1" stopColor="#6e967f" /></linearGradient>
      <linearGradient id={`${id}-lca`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#467e83" /><stop offset=".48" stopColor="#90b8b3" /><stop offset=".8" stopColor="#669d9c" /><stop offset="1" stopColor="#3c717b" /></linearGradient>
      <linearGradient id={`${id}-ta`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#8e4857" /><stop offset=".28" stopColor="#c0797e" /><stop offset=".55" stopColor="#d39b96" /><stop offset=".83" stopColor="#b66c75" /><stop offset="1" stopColor="#844554" /></linearGradient>
      <linearGradient id={`${id}-ia`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6f527b" /><stop offset=".38" stopColor="#b49bbd" /><stop offset="1" stopColor="#82628d" /></linearGradient>
      <linearGradient id={`${id}-arytenoid`} x1="0" y1="0" x2=".9" y2="1"><stop stopColor="#fbf8ed" /><stop offset=".48" stopColor="#e7e4d7" /><stop offset=".75" stopColor="#c2c8be" /><stop offset="1" stopColor="#9ea9a2" /></linearGradient>
      <linearGradient id={`${id}-fold`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#c7b4ac" /><stop offset=".35" stopColor="#fffdf1" /><stop offset=".7" stopColor="#fdfbed" /><stop offset="1" stopColor="#b5b4a8" /></linearGradient>
      <radialGradient id={`${id}-lumen`} cx="50%" cy="30%" r="70%"><stop stopColor="#fffefa" /><stop offset=".65" stopColor="#f6f2e9" /><stop offset="1" stopColor="#d4d8cd" /></radialGradient>
      <clipPath id={`${id}-ta-clip`}><path d={ta} /></clipPath>
      <clipPath id={`${id}-pca-clip`}><path d={pca} /></clipPath>
      <clipPath id={`${id}-lca-clip`}><path d={lca} /></clipPath>
    </defs>

    <path d="M100 161C91 218 118 323 159 388C181 423 194 442 210 454C226 441 240 421 261 387C302 321 329 218 320 160C298 116 252 94 210 96C167 94 121 117 100 161Z" fill="#dfd9cb" opacity=".35" />
    <path d={cricoid} fill={`url(#${id}-cricoid)`} fillRule="evenodd" stroke="#7d8e85" strokeWidth="1.5" />
    <path d="M111 153C113 117 133 94 169 85C197 77 224 77 250 85C283 95 306 119 309 151" fill="none" stroke="#fdfcf2" strokeWidth="2.3" opacity=".8" />
    <path d="M132 153C132 124 151 109 175 101C198 94 225 95 245 102C271 109 288 128 289 156" fill="none" stroke="#8b9c90" strokeWidth="1.1" />
    {Array.from({ length: 21 }, (_, i) => <path key={`lamina-${i}`} d={`M${148 + i * 6} ${94 - Math.sin(i / 20 * Math.PI) * 9}Q${149 + i * 6} 105 ${149 + i * 6} ${116 + Math.abs(i - 10) * .6}`} fill="none" stroke="#7e8e80" strokeWidth=".6" opacity=".22" />)}
    <path d="M130 252C145 317 180 382 210 401C244 380 276 315 290 252" fill="none" stroke="#899e90" strokeWidth="2.1" opacity=".6" />
    <path d="M136 262C154 325 183 376 210 393C237 376 269 321 284 262" fill="none" stroke="#fffdf4" strokeWidth="1.3" opacity=".9" />

    {[false, true].map(mirror => <g key={`thyroid-${mirror}`} transform={mirror ? 'translate(420 0) scale(-1 1)' : undefined}>
      <path d={leftThyroid} fill={`url(#${id}-thyroid)`} stroke="#8c8d83" strokeWidth="1.5" />
      <path d="M79 30C82 51 86 86 86 106C87 127 80 141 77 157C69 199 86 244 102 282C126 340 165 414 202 457" fill="none" stroke="#fffdf2" strokeWidth="2.7" opacity=".9" />
      <path d="M98 151C90 190 100 226 114 266C137 327 173 398 207 433" fill="none" stroke="#8d9285" strokeWidth="4.5" opacity=".42" />
      <path d="M73 151C74 146 81 142 86 144M70 170Q79 165 88 171M74 195Q82 187 89 193M86 231Q94 225 99 230M102 270Q109 264 114 271M123 316Q132 313 135 320M149 366Q156 361 161 368M177 410Q184 405 190 413" fill="none" stroke="#8e9084" strokeWidth=".75" opacity=".6" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${81 + i * 7.1} ${238 + i * 12.4}q${8 - i * .1} -5 12 1`} fill="none" stroke="#9b9e91" strokeWidth=".7" opacity=".38" />)}
    </g>)}

    {[false, true].map(mirror => <g key={`muscles-${mirror}`} transform={mirror ? 'translate(420 0) scale(-1 1)' : undefined}>
      <path d={pca} fill={`url(#${id}-pca)`} stroke="#527867" strokeWidth="1.3" />
      <g clipPath={`url(#${id}-pca-clip)`}>
        {Array.from({ length: 23 }, (_, i) => <path key={i} d={`M${112 + i * 2.9} ${85 + Math.sin(i / 22 * Math.PI) * 5}C${113 + i * 2.7} 109 ${119 + i * 1.8} 133 ${142 + i * .45} 156`} fill="none" stroke={i % 3 === 0 ? '#e3e6c7' : '#446d59'} strokeWidth={i % 3 === 0 ? '.65' : '.55'} opacity={i % 3 === 0 ? '.58' : '.43'} />)}
      </g>
      <path d="M146 153Q158 147 171 140" fill="none" stroke="#cfd8b8" strokeWidth="2" opacity=".65" />
      <path d={lca} fill={`url(#${id}-lca)`} stroke="#517e80" strokeWidth="1.3" />
      <g clipPath={`url(#${id}-lca-clip)`}>
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${124 + i * .95} ${167 + i * .3}C${112 + i * 1.6} 195 ${118 + i * 1.5} 247 ${127 + i * 1.7} 284`} fill="none" stroke={i % 3 === 0 ? '#d0ded0' : '#3d7179'} strokeWidth=".65" opacity=".55" />)}
      </g>
      <path d={ta} fill={`url(#${id}-ta)`} stroke="#91515e" strokeWidth="1.4" />
      <g clipPath={`url(#${id}-ta-clip)`}>
        {Array.from({ length: 19 }, (_, i) => <path key={i} d={`M${144 + i * 1.8} 174C${140 + i * 1.85} 245 ${152 + i * 1.9} 356 ${203 + i * .42} 449`} fill="none" stroke={i % 3 === 0 ? '#efc2af' : '#88434e'} strokeWidth={i % 3 === 0 ? '.75' : '.6'} opacity={i % 3 === 0 ? '.5' : '.48'} />)}
      </g>
      <path d="M148 180Q158 181 174 188" fill="none" stroke="#ddd3bd" strokeWidth="3" opacity=".75" />
      <path d="M195 424Q201 439 210 444" fill="none" stroke="#d8cdb4" strokeWidth="3.4" />
    </g>)}

    <path d="M164 128C178 120 194 121 210 122C228 121 244 122 258 130L259 150C241 144 226 144 210 145C192 143 177 144 162 151Z" fill={`url(#${id}-ia)`} stroke="#735780" strokeWidth="1.2" />
    {Array.from({ length: 9 }, (_, i) => <path key={`ia-${i}`} d={`M165 ${129 + i * 2.1}Q210 ${120 + i * 2.3} 257 ${130 + i * 2.1}`} fill="none" stroke={i % 2 === 0 ? '#d2bbd0' : '#745880'} strokeWidth=".6" opacity=".65" />)}

    {[false, true].map(mirror => <g key={`arytenoid-${mirror}`} transform={mirror ? 'translate(420 0) scale(-1 1)' : undefined}>
      <path d={arytenoid} fill={`url(#${id}-arytenoid)`} stroke="#88958c" strokeWidth="1.25" />
      <path d="M156 133C166 128 172 134 171 144L163 159L151 169Q140 169 130 163" fill="none" stroke="#fffdf2" strokeWidth="2.5" opacity=".85" />
      <path d="M171 144Q160 149 163 159L177 175M151 169L163 159" fill="none" stroke="#89958a" strokeWidth=".9" />
      <path d="M158 133Q160 143 154 149" fill="none" stroke="#a4aea1" strokeWidth=".8" />
      <path d="M174 157Q179 163 178 169" fill="none" stroke="#c0c7b9" strokeWidth="1.1" />
    </g>)}

    <path d="M184 178Q210 188 236 178C229 222 224 267 222 314C220 365 216 414 210 442C204 413 199 365 198 314C196 264 190 222 184 178Z" fill={`url(#${id}-lumen)`} stroke="#b9bfb1" strokeWidth="1.1" />
    <path d="M176 182L184 178C190 222 196 276 198 314C200 371 205 420 210 442L205 443C193 406 186 359 183 312C180 261 175 214 176 182Z" fill={`url(#${id}-fold)`} stroke="#a99f91" strokeWidth=".9" />
    <path d="M244 182L236 178C230 222 224 276 222 314C220 371 215 420 210 442L215 443C227 406 234 359 237 312C240 261 245 214 244 182Z" fill={`url(#${id}-fold)`} stroke="#a99f91" strokeWidth=".9" />
    <path d="M182 183C186 234 192 277 194 315C197 372 202 416 208 437M238 183C234 234 228 277 226 315C223 372 218 416 212 437" fill="none" stroke="#fffdf4" strokeWidth="2.6" />
    <path d="M184 180Q210 194 236 180" fill="none" stroke="#7e8a7c" strokeWidth="1.3" opacity=".65" />
    <path d="M203 449Q210 455 218 449" fill="none" stroke="#a6a797" strokeWidth="1" />
  </g>
}
