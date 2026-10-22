// 上方斜观并移去部分覆盖组织，显示舌根、喉入口、声门和后方结构的层次关系。
export function SuperiorAirwayArt({ id }: { id: string }) {
  const outer = 'M260 28C315 26 377 55 414 104C456 158 474 226 470 298C467 363 442 425 400 464C366 498 315 517 260 523C205 517 154 498 120 464C78 425 53 363 50 298C46 226 64 158 106 104C143 55 205 26 260 28Z'
  const leftWall = 'M122 129C91 177 80 235 83 289C86 348 109 397 149 431L169 406C143 375 129 335 128 290C124 239 139 185 157 153Z'
  const leftInner = 'M150 162C137 201 135 246 139 290C143 327 151 365 174 394L194 374C182 344 177 313 180 279C179 237 187 204 195 183Z'
  const tongue = 'M133 139C149 112 182 91 220 87C244 83 249 91 260 95C271 91 276 83 300 87C338 91 371 112 387 139C365 143 349 160 333 179C311 196 285 202 260 201C235 202 209 196 187 179C171 160 155 143 133 139Z'
  const epiglottis = 'M258 255C255 233 239 211 224 193C211 178 215 157 231 149C244 142 252 146 260 150C268 146 276 142 289 149C305 157 309 178 296 193C281 211 265 233 262 255Z'
  const leftVestibule = 'M254 236C233 226 211 238 197 263C181 292 181 330 195 356C206 372 218 379 230 381C228 348 235 300 254 265Z'
  const leftThyroid = 'M204 209C185 207 164 222 153 244C135 282 138 327 155 367C172 406 206 432 240 439L243 418C217 410 196 389 183 359C169 329 167 296 176 270C184 248 194 237 209 234Z'
  return <g>
    <defs>
      <linearGradient id={`${id}-section`} x1=".1" y1="0" x2=".9" y2="1"><stop stopColor="#f7e8dc" /><stop offset=".35" stopColor="#eedbcf" /><stop offset=".72" stopColor="#e4c5bb" /><stop offset="1" stopColor="#bd8d88" /></linearGradient>
      <radialGradient id={`${id}-cavity`} cx="50%" cy="35%" r="65%"><stop stopColor="#552e35" /><stop offset=".55" stopColor="#713d44" /><stop offset="1" stopColor="#b67173" /></radialGradient>
      <linearGradient id={`${id}-muscle`} x1="0" y1=".3" x2="1" y2=".7"><stop stopColor="#a95c67" /><stop offset=".25" stopColor="#d99999" /><stop offset=".6" stopColor="#c58288" /><stop offset="1" stopColor="#954b58" /></linearGradient>
      <linearGradient id={`${id}-tongue`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e6b7ad" /><stop offset=".3" stopColor="#d99395" /><stop offset=".7" stopColor="#bd727f" /><stop offset="1" stopColor="#92505e" /></linearGradient>
      <linearGradient id={`${id}-mucosa`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4aca8" /><stop offset=".45" stopColor="#c98088" /><stop offset="1" stopColor="#a45b70" /></linearGradient>
      <linearGradient id={`${id}-epiglottis`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#efd4bf" /><stop offset=".32" stopColor="#e1bab1" /><stop offset=".7" stopColor="#cf969d" /><stop offset="1" stopColor="#a86e7b" /></linearGradient>
      <linearGradient id={`${id}-bone`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fffbed" /><stop offset=".35" stopColor="#eee1c5" /><stop offset=".75" stopColor="#d8c7aa" /><stop offset="1" stopColor="#b5a98f" /></linearGradient>
      <linearGradient id={`${id}-cartilage`} x1="0" y1=".3" x2="1" y2=".8"><stop stopColor="#adc1c4" /><stop offset=".25" stopColor="#d9e5e2" /><stop offset=".55" stopColor="#c3d5d3" /><stop offset="1" stopColor="#869fa7" /></linearGradient>
      <linearGradient id={`${id}-fold`} x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#cbb4ac" /><stop offset=".35" stopColor="#fff9e7" /><stop offset=".62" stopColor="#fffdf1" /><stop offset="1" stopColor="#d6ccbc" /></linearGradient>
      <radialGradient id={`${id}-glottis`} cx="50%" cy="80%" r="75%"><stop stopColor="#352b35" /><stop offset=".6" stopColor="#5d3341" /><stop offset="1" stopColor="#8c4f59" /></radialGradient>
      <clipPath id={`${id}-wall-clip`}><path d={leftWall} /></clipPath>
      <clipPath id={`${id}-inner-clip`}><path d={leftInner} /></clipPath>
      <clipPath id={`${id}-tongue-clip`}><path d={tongue} /></clipPath>
      <clipPath id={`${id}-vestibule-clip`}><path d={leftVestibule} /></clipPath>
      <pattern id={`${id}-bone-section`} width="9" height="10" patternUnits="userSpaceOnUse"><path d="M1 1 4 5 2 9M4 5 8 3M4 5 8 9" fill="none" stroke="#a8997f" strokeWidth=".55" opacity=".58" /></pattern>
    </defs>

    <path d={outer} fill={`url(#${id}-section)`} stroke="#bda79d" strokeWidth="1.5" />
    <path d="M260 42C317 40 373 70 405 115C443 169 457 231 453 296C449 357 427 410 388 448C357 478 311 496 260 504C209 496 163 478 132 448C93 410 71 357 67 296C63 231 77 169 115 115C147 70 203 40 260 42Z" fill="#f4e6dc" stroke="#fdf4e7" strokeWidth="3" />
    <path d="M260 72C326 68 380 108 407 170C433 230 431 303 410 357C387 415 329 459 260 465C191 459 133 415 110 357C89 303 87 230 113 170C140 108 194 68 260 72Z" fill={`url(#${id}-cavity)`} stroke="#b97d80" strokeWidth="1.5" />

    {[false, true].map(mirror => <g key={`wall-${mirror}`} transform={mirror ? 'translate(520 0) scale(-1 1)' : undefined}>
      <path d={leftWall} fill={`url(#${id}-muscle)`} stroke="#ab6a73" strokeWidth="1.1" />
      <g clipPath={`url(#${id}-wall-clip)`}>{Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${117 + i * .9} ${121 + i * 1.1}C${78 + i * 1.1} 228 ${83 + i * 1.7} 350 ${142 + i * .8} ${434 - i * .6}`} fill="none" stroke={i % 4 === 0 ? '#efd0b9' : '#8d4755'} strokeWidth={i % 4 === 0 ? '.7' : '.55'} opacity={i % 4 === 0 ? '.58' : '.46'} />)}</g>
      <path d="M122 144C96 195 89 252 96 306C102 354 119 393 148 418" fill="none" stroke="#f3c8bc" strokeWidth="1.7" opacity=".75" />
      <path d={leftInner} fill={`url(#${id}-muscle)`} stroke="#974b5b" strokeWidth="1.1" />
      <g clipPath={`url(#${id}-inner-clip)`}>{Array.from({ length: 25 }, (_, i) => <path key={i} d={`M${146 + i * 2} ${157 + i * .7}C${128 + i * 2.6} 230 ${145 + i * 2} 323 ${171 + i * 1.25} ${398 - i * 1.1}`} fill="none" stroke={i % 4 === 0 ? '#efc6b1' : '#8e4858'} strokeWidth=".65" opacity=".5" />)}</g>
      <path d="M131 382C108 396 101 417 115 436C126 453 149 462 171 469L196 438C165 425 149 408 131 382Z" fill={`url(#${id}-muscle)`} stroke="#a2676c" strokeWidth="1.1" />
      {Array.from({ length: 12 }, (_, i) => <path key={`posterior-${i}`} d={`M${115 + i * 1.5} ${410 + i * 2.2}Q${141 + i * 1.5} ${418 + i * 1.8} ${171 + i * 1.6} ${451 + i * 1.2}`} fill="none" stroke={i % 3 === 0 ? '#f0cbb6' : '#8b4d59'} strokeWidth=".7" opacity=".6" />)}
    </g>)}

    <path d={tongue} fill={`url(#${id}-tongue)`} stroke="#b6717b" strokeWidth="1.2" />
    <g clipPath={`url(#${id}-tongue-clip)`}>
      {Array.from({ length: 37 }, (_, i) => <path key={`tongue-${i}`} d={`M${135 + i * 7} ${113 + Math.sin(i / 36 * Math.PI) * -24}Q${146 + i * 6.3} ${156 + Math.sin(i / 36 * Math.PI) * 22} ${166 + i * 5.25} ${187 + Math.sin(i / 36 * Math.PI) * 18}`} fill="none" stroke={i % 4 === 0 ? '#f1c1ad' : '#9e5261'} strokeWidth={i % 4 === 0 ? '.8' : '.55'} opacity=".48" />)}
      {Array.from({ length: 36 }, (_, i) => <path key={`papilla-${i}`} d={`M${165 + (i % 12) * 17} ${118 + Math.floor(i / 12) * 15}q3 -3 6 0`} fill="none" stroke="#f7d3bf" strokeWidth="1" opacity=".4" />)}
    </g>
    <path d="M260 104Q252 139 260 174" fill="none" stroke="#9b5262" strokeWidth="1.5" opacity=".6" />
    <path d="M157 139Q201 109 249 114M271 114Q319 109 363 139" fill="none" stroke="#f0b8a9" strokeWidth="2" opacity=".6" />

    <path d="M149 172C158 163 166 168 175 177C195 194 225 201 260 201C295 201 325 194 345 177C354 168 362 163 371 172L366 191C341 217 303 228 260 228C217 228 179 217 154 191Z" fill={`url(#${id}-bone)`} stroke="#b3a387" strokeWidth="1.2" />
    <path d="M155 176C179 208 219 217 260 217C301 217 341 208 365 176" fill="none" stroke="#fff8de" strokeWidth="3" opacity=".8" />
    <path d="M188 204Q198 191 207 207M224 214Q231 200 239 216M281 216Q289 200 296 214M313 207Q322 191 332 204" fill="none" stroke="#c0ac84" strokeWidth="1.1" opacity=".8" />

    <path d="M206 223C185 236 171 259 169 290C165 333 180 374 207 401C221 415 241 424 260 426C279 424 299 415 313 401C340 374 355 333 351 290C349 259 335 236 314 223C298 229 282 233 260 232C238 233 222 229 206 223Z" fill={`url(#${id}-cartilage)`} stroke="#879fa3" strokeWidth="1.4" />
    <path d={leftThyroid} fill={`url(#${id}-cartilage)`} stroke="#8ca4a5" strokeWidth="1.15" />
    <path d={leftThyroid} transform="translate(520 0) scale(-1 1)" fill={`url(#${id}-cartilage)`} stroke="#8ca4a5" strokeWidth="1.15" />
    <path d="M195 233C172 249 162 279 167 314C172 353 187 383 211 399M325 233C348 249 358 279 353 314C348 353 333 383 309 399" fill="none" stroke="#eef4e8" strokeWidth="2.5" opacity=".8" />
    <path d="M216 239C199 253 189 280 188 305C187 344 204 380 227 397Q260 416 293 397C316 380 333 344 332 305C331 280 321 253 304 239Q260 224 216 239Z" fill={`url(#${id}-cavity)`} stroke="#9a626e" strokeWidth="1.2" />

    {[false, true].map(mirror => <g key={`vestibule-${mirror}`} transform={mirror ? 'translate(520 0) scale(-1 1)' : undefined}>
      <path d={leftVestibule} fill={`url(#${id}-mucosa)`} stroke="#b1747b" strokeWidth="1.1" />
      <g clipPath={`url(#${id}-vestibule-clip)`}>{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${218 + i * 1.9} ${232 + i * .75}C${181 + i * 2} 274 ${185 + i * 2.7} 338 ${216 + i * 1.5} 380`} fill="none" stroke={i % 3 === 0 ? '#f0c4af' : '#a95e6d'} strokeWidth=".7" opacity=".5" />)}</g>
      <path d="M249 247C227 262 218 294 216 322C215 346 220 365 228 378" fill="none" stroke="#f2c4af" strokeWidth="2" opacity=".75" />
    </g>)}

    <path d={epiglottis} fill={`url(#${id}-epiglottis)`} stroke="#a8757d" strokeWidth="1.2" />
    <path d="M259 240C257 213 239 190 231 172C229 164 234 158 241 157M261 240C263 213 281 190 289 172C291 164 286 158 279 157" fill="none" stroke="#f9dec8" strokeWidth="2" opacity=".75" />
    <path d="M260 155Q252 185 260 235" fill="none" stroke="#a96678" strokeWidth="1.2" opacity=".6" />
    <path d="M238 162Q245 175 253 184M282 162Q275 175 267 184M245 182Q251 195 256 201M275 182Q269 195 264 201" fill="none" stroke="#c79098" strokeWidth=".8" opacity=".75" />

    <path d="M260 266C253 289 244 329 235 374Q260 389 285 374C276 329 267 289 260 266Z" fill={`url(#${id}-glottis)`} stroke="#8d5b63" strokeWidth="1" />
    <path d="M253 263C241 282 230 315 225 349C223 361 224 374 230 380L238 376C244 340 253 297 260 270Z" fill={`url(#${id}-fold)`} stroke="#b5a79b" strokeWidth=".85" />
    <path d="M267 263C279 282 290 315 295 349C297 361 296 374 290 380L282 376C276 340 267 297 260 270Z" fill={`url(#${id}-fold)`} stroke="#b5a79b" strokeWidth=".85" />
    <path d="M257 274C249 304 241 343 235 372M263 274C271 304 279 343 285 372" fill="none" stroke="#fffdf2" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M235 372L242 381C241 386 236 389 233 393C225 401 211 399 207 390C205 384 212 379 219 377C221 370 227 366 232 369ZM285 372L278 381C279 386 284 389 287 393C295 401 309 399 313 390C315 384 308 379 301 377C299 370 293 366 288 369Z" fill={`url(#${id}-cartilage)`} stroke="#829c9f" strokeWidth="1.1" />
    <path d="M232 372Q225 370 224 379L214 389Q226 395 233 389L238 381M288 372Q295 370 296 379L306 389Q294 395 287 389L282 381" fill="none" stroke="#f1f3e7" strokeWidth="1.6" />
    <path d="M224 379L233 389M296 379L287 389" fill="none" stroke="#9badab" strokeWidth=".85" />
    <path d="M233 394Q260 403 287 394L286 402Q260 412 234 402Z" fill={`url(#${id}-muscle)`} stroke="#a56872" strokeWidth=".8" />
    <path d="M236 397Q260 405 284 397M237 400Q260 408 283 400" fill="none" stroke="#edb8a9" strokeWidth=".8" opacity=".7" />
    <path d="M211 410C226 419 243 424 260 424C277 424 294 419 309 410" fill="none" stroke="#a3b7b7" strokeWidth="7" />
    <path d="M215 409Q260 433 305 409" fill="none" stroke="#e9eee2" strokeWidth="1.8" />

    <path d="M215 430C228 420 245 425 260 426C275 425 292 420 305 430C311 438 309 452 299 458C286 464 273 460 260 459C247 460 234 464 221 458C211 452 209 438 215 430Z" fill="#c5888f" stroke="#9f6774" strokeWidth="1.2" />
    <path d="M224 443C234 433 244 445 252 439Q260 433 268 439C276 445 286 433 296 443C286 452 277 441 268 447Q260 453 252 447C243 441 234 452 224 443Z" fill="#754955" stroke="#e1b2aa" strokeWidth="1.1" />

    <path d="M211 468C217 458 236 456 260 458C284 456 303 458 309 468L307 487L294 500L289 520L277 528L260 536L243 528L231 520L226 500L213 487Z" fill={`url(#${id}-bone)`} stroke="#a99c85" strokeWidth="1.3" />
    <path d="M217 468Q260 454 303 468L300 484Q260 498 220 484Z" fill={`url(#${id}-bone-section)`} stroke="#c2b496" strokeWidth="1" />
    <path d="M237 503Q260 491 283 503L279 516Q260 526 241 516Z" fill="#b6b9a9" stroke="#8f9a8e" strokeWidth="1" />
    <path d="M242 506Q260 498 278 506Q276 516 260 518Q244 516 242 506Z" fill="#eeeadd" stroke="#c9c8b5" strokeWidth=".8" />
    <path d="M234 492Q260 503 286 492M243 521Q260 532 277 521" fill="none" stroke="#fff8df" strokeWidth="1.8" opacity=".8" />
    <path d="M211 477L190 474L172 460L166 466L182 489L211 493M309 477L330 474L348 460L354 466L338 489L309 493" fill={`url(#${id}-bone)`} stroke="#ac9e85" strokeWidth="1.1" />
  </g>
}
