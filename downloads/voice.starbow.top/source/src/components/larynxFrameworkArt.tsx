interface FrameworkArtProps { id: string }

// 正前方解剖图。软骨环在此视角只显示前弓，后方开放部位不投影为闭合环。
export function FrameworkArt({ id }: FrameworkArtProps) {
  const fill = (name: string) => `url(#${id}-${name})`
  const cartilage = 'M113 210C124 199 137 200 151 205C168 210 181 226 190 247C194 257 197 262 200 263C203 262 206 257 210 247C219 226 232 210 249 205C263 200 276 199 287 210C301 223 311 244 308 264C306 282 298 297 294 314C290 330 280 340 267 343C246 347 224 347 209 352C202 355 198 355 191 352C176 347 154 347 133 343C120 340 110 330 106 314C102 297 94 282 92 264C89 244 99 223 113 210Z'
  const hyoid = 'M96 56C99 51 104 53 106 60C109 73 120 83 136 86C145 88 153 84 160 82C170 87 183 89 200 89C217 89 230 87 240 82C247 84 255 88 264 86C280 83 291 73 294 60C296 53 301 51 304 56C310 70 304 88 292 99C280 110 261 112 246 107C239 115 219 119 200 119C181 119 161 115 154 107C139 112 120 110 108 99C96 88 90 70 96 56Z'
  const membrane = 'M132 108C155 118 178 120 200 119C222 120 245 118 268 108C274 145 283 181 290 220L260 241L200 271L140 241L110 220C117 181 126 145 132 108Z'
  return <g>
    <defs>
      <linearGradient id={`${id}-bone`} x1="0" x2=".9" y1="0" y2="1"><stop stopColor="#fff7df" /><stop offset=".3" stopColor="#ecd8aa" /><stop offset=".53" stopColor="#fff8df" /><stop offset=".78" stopColor="#cfb77e" /><stop offset="1" stopColor="#ead6a4" /></linearGradient>
      <linearGradient id={`${id}-horn`} x1="0" x2="1"><stop stopColor="#9baeb5" /><stop offset=".36" stopColor="#e0ebec" /><stop offset=".63" stopColor="#b9cdd1" /><stop offset="1" stopColor="#8ca4ad" /></linearGradient>
      <linearGradient id={`${id}-cartilage`} x1="0" x2="1" y1=".1" y2=".2"><stop stopColor="#9eb9c3" /><stop offset=".17" stopColor="#d7e8eb" /><stop offset=".43" stopColor="#b9d2db" /><stop offset=".52" stopColor="#d0e2e6" /><stop offset=".73" stopColor="#a8c4ce" /><stop offset="1" stopColor="#7f9ea9" /></linearGradient>
      <radialGradient id={`${id}-left-surface`} cx=".42" cy=".24" r=".75"><stop stopColor="#eff6f4" stopOpacity=".8" /><stop offset=".48" stopColor="#c8dce2" stopOpacity=".22" /><stop offset="1" stopColor="#627f8d" stopOpacity=".15" /></radialGradient>
      <linearGradient id={`${id}-ridge`} x1="0" x2="1"><stop stopColor="#92b0be" stopOpacity=".05" /><stop offset=".44" stopColor="#edfaf8" stopOpacity=".8" /><stop offset=".55" stopColor="#9ab9c6" stopOpacity=".16" /><stop offset="1" stopColor="#6d8d9c" stopOpacity=".45" /></linearGradient>
      <linearGradient id={`${id}-membrane`} x1="0" x2="1"><stop stopColor="#cabbb1" /><stop offset=".25" stopColor="#f2e8dc" /><stop offset=".52" stopColor="#faf1e4" /><stop offset=".78" stopColor="#e5d7cb" /><stop offset="1" stopColor="#c3b3aa" /></linearGradient>
      <linearGradient id={`${id}-ligament`} x1="0" x2="1"><stop stopColor="#c2b5ac" /><stop offset=".4" stopColor="#fff7ea" /><stop offset=".6" stopColor="#ede1d0" /><stop offset="1" stopColor="#c6b6a8" /></linearGradient>
      <linearGradient id={`${id}-trachea`} x1="0" x2="1"><stop stopColor="#829da7" /><stop offset=".24" stopColor="#d2e5e8" /><stop offset=".5" stopColor="#e0eeed" /><stop offset=".76" stopColor="#b5cdd3" /><stop offset="1" stopColor="#7b99a5" /></linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#dcecef" /><stop offset=".45" stopColor="#adc9d2" /><stop offset="1" stopColor="#7996a1" /></linearGradient>
      <clipPath id={`${id}-membrane-clip`}><path d={membrane} /></clipPath>
      <clipPath id={`${id}-thyroid-clip`}><path d={cartilage} /></clipPath>
      <clipPath id={`${id}-hyoid-clip`}><path d={hyoid} /></clipPath>
    </defs>

    {/* 气管前壁、环间韧带与各软骨前弓。 */}
    <path fill={fill('membrane')} stroke="#b7b1a8" strokeWidth="1.1" d="M149 439C144 476 145 520 148 564C177 574 223 574 252 564C255 520 256 476 251 439Z" />
    {[449, 473, 497, 521, 545].map((y, index) => <g key={y}>
      <path fill={fill('trachea')} stroke="#819eaa" strokeWidth="1.25" d={`M${147 + index * .35} ${y}C170 ${y + 7} 230 ${y + 7} ${253 - index * .35} ${y}L${254 - index * .35} ${y + 15}C230 ${y + 25} 170 ${y + 25} ${146 + index * .35} ${y + 15}Z`} />
      <path fill="none" stroke="#f5ffff" strokeOpacity=".62" strokeWidth="1.15" d={`M151 ${y + 3}C175 ${y + 10} 225 ${y + 10} 249 ${y + 3}`} />
      <path fill="none" stroke="#5f7f8c" strokeOpacity=".24" strokeWidth=".8" d={`M151 ${y + 17}C177 ${y + 25} 223 ${y + 25} 249 ${y + 17}`} />
    </g>)}

    {/* 两侧下角终止于环甲关节；膜先绘制在软骨后方。 */}
    <path fill={fill('membrane')} stroke="#b7aaa2" strokeWidth="1.2" d="M151 342C165 356 183 361 200 362C217 361 235 356 249 342C251 366 258 390 264 413C246 428 154 428 136 413C142 390 149 366 151 342Z" />
    {Array.from({ length: 18 }, (_, i) => {
      const x = 149 + i * 6
      const dx = (x - 200) * .2
      return <path key={x} fill="none" stroke={i % 3 === 0 ? '#b4a99d' : '#fff9ef'} strokeOpacity={i % 3 === 0 ? .5 : .65} strokeWidth=".75" d={`M${x} 350C${x + dx * .4} 375 ${x + dx} 394 ${x + dx} 414`} />
    })}
    <path fill={fill('ligament')} stroke="#d6c9b8" strokeWidth=".7" d="M190 357C194 363 206 363 210 357L217 415C205 420 195 420 183 415Z" />
    <path fill={fill('horn')} stroke="#8fa6af" strokeWidth="1.3" d="M115 323C111 347 114 370 118 389C120 397 124 400 129 395C133 390 129 383 127 375L130 337Z" />
    <path fill={fill('horn')} stroke="#8fa6af" strokeWidth="1.3" d="M285 323C289 347 286 370 282 389C280 397 276 400 271 395C267 390 271 383 273 375L270 337Z" />

    {/* 甲状舌骨膜纤维由舌骨下缘向甲状软骨上缘铺展。 */}
    <path d={membrane} fill={fill('membrane')} stroke="#b7aaa0" strokeWidth="1.1" />
    <g clipPath={fill('membrane-clip')}>
      {Array.from({ length: 28 }, (_, i) => {
        const x = 130 + i * 5.2
        const bend = (x - 200) * .17
        return <path key={i} d={`M${x} 110C${x + bend * .7} 144 ${x + bend} 184 ${x + bend * 1.8} 246`} fill="none" stroke={i % 4 === 0 ? '#a99b90' : '#fff9ec'} strokeOpacity={i % 4 === 0 ? .42 : .52} strokeWidth={i % 4 === 0 ? .9 : .7} />
      })}
    </g>
    <path d="M197 120C197 162 195 201 197 249M203 120C203 162 205 201 203 249" fill="none" stroke="#fffbed" strokeWidth="3.5" strokeOpacity=".7" />
    <path d="M133 114C128 137 120 165 116 191M267 114C272 137 280 165 284 191" fill="none" stroke="#d2c3af" strokeWidth="5" strokeLinecap="round" />

    {/* 上角投影在翼板后外侧，形态细长而非翼板的几何延长线。 */}
    <path fill={fill('horn')} stroke="#869fa9" strokeWidth="1.2" d="M109 223C106 211 104 196 102 182C100 171 99 162 102 157C104 153 108 156 110 163C115 176 116 191 121 204L128 217Z" />
    <path fill={fill('horn')} stroke="#869fa9" strokeWidth="1.2" d="M291 223C294 211 296 196 298 182C300 171 301 162 298 157C296 153 292 156 290 163C285 176 284 191 279 204L272 217Z" />
    <path fill="none" stroke="#f0f7f5" strokeWidth="1" strokeOpacity=".8" d="M106 162C109 180 110 194 115 208M294 162C291 180 290 194 285 208" />

    {/* 甲状软骨双翼与前正中喉结棱，保留深上切迹和自然起伏的下缘。 */}
    <path d={cartilage} fill={fill('cartilage')} stroke="#7898a6" strokeWidth="1.6" />
    <path d={cartilage} fill={fill('left-surface')} />
    <path fill={fill('ridge')} d="M190 246C197 263 203 263 210 246C210 274 212 306 222 343C208 350 204 354 200 354C196 354 192 350 178 343C188 306 190 274 190 246Z" />
    <path fill="#6f8d9a" fillOpacity=".13" d="M96 242C92 261 105 287 110 309C113 323 121 334 134 337C154 342 175 341 191 347L200 351L200 355C191 352 186 349 176 349L132 344C117 341 110 333 106 315L95 282C90 267 89 254 96 242Z" />
    <path fill="#607e8e" fillOpacity=".16" d="M304 241C307 258 302 277 295 295C287 317 285 333 267 337C248 342 225 341 210 347L200 352V355C209 353 215 349 227 348L268 344C283 340 290 330 294 315L304 282C312 265 311 253 304 241Z" />
    <path fill="none" stroke="#e8f5f4" strokeWidth="2" strokeOpacity=".84" strokeLinecap="round" d="M114 212C128 203 140 204 153 209C168 216 179 230 187 249M213 249C221 230 232 216 247 209C260 204 272 203 286 212" />
    <path fill="none" stroke="#698c9d" strokeWidth="1.2" strokeOpacity=".58" d="M189 247C195 266 205 270 211 247" />
    <path fill="none" stroke="#f2f9f7" strokeWidth="1.4" strokeOpacity=".65" strokeLinecap="round" d="M198 274C196 297 197 318 200 338" />
    <path fill="none" stroke="#7696a5" strokeWidth="1.1" strokeOpacity=".63" strokeLinecap="round" d="M203 275C208 301 207 322 204 344" />
    <g clipPath={fill('thyroid-clip')} fill="none" strokeLinecap="round">
      {Array.from({ length: 17 }, (_, i) => <g key={i}>
        <path stroke="#edf5f2" strokeOpacity={i % 3 === 0 ? .58 : .3} strokeWidth=".75" d={`M${106 + i * 1.7} ${228 + i * 6}C${129 + i} ${218 + i * 6} ${157 + i * .7} ${233 + i * 5.7} ${181 + i * .25} ${263 + i * 4}`} />
        <path stroke="#668894" strokeOpacity=".12" strokeWidth=".8" d={`M${294 - i * 1.7} ${228 + i * 6}C${271 - i} ${218 + i * 6} ${243 - i * .7} ${233 + i * 5.7} ${219 - i * .25} ${263 + i * 4}`} />
      </g>)}
      <path stroke="#6b8d9a" strokeOpacity=".42" strokeWidth="2.2" d="M122 220C132 251 145 281 157 330M278 220C268 251 255 281 243 330" />
      <path stroke="#f4f9f4" strokeOpacity=".7" strokeWidth="1.15" d="M125 220C135 252 148 282 160 329M275 220C265 252 252 282 240 329" />
    </g>
    <path fill="none" stroke="#71909e" strokeOpacity=".65" strokeWidth="1.05" d="M133 342C154 346 177 345 192 351C198 353 202 353 208 351C223 345 246 346 267 342" />

    {/* 环状软骨前弓低而窄；两侧关节面向后升高。 */}
    <path fill={fill('rim')} stroke="#7796a3" strokeWidth="1.5" d="M140 403C156 409 173 414 200 415C227 414 244 409 260 403C265 410 268 424 265 436C253 447 224 451 200 451C176 451 147 447 135 436C132 424 135 410 140 403Z" />
    <path fill="none" stroke="#f0fafa" strokeWidth="1.5" strokeOpacity=".76" d="M141 406C171 419 229 419 259 406" />
    <path fill="none" stroke="#688894" strokeWidth="1.3" strokeOpacity=".5" d="M138 435C163 448 237 448 262 435" />
    <path fill="none" stroke="#dcecf0" strokeWidth=".8" strokeOpacity=".85" d="M142 419C176 430 224 430 258 419M142 425C176 436 224 436 258 425" />
    <path fill="#8da6af" fillOpacity=".65" d="M125 390C128 386 133 387 135 392C135 399 130 404 126 401C123 399 123 394 125 390ZM275 390C272 386 267 387 265 392C265 399 270 404 274 401C277 399 277 394 275 390Z" />

    {/* 舌骨体、大角与小角采用独立骨皮质边缘，呈弯曲三维投影。 */}
    <path d={hyoid} fill={fill('bone')} stroke="#b59b66" strokeWidth="1.35" />
    <path fill="#fff7d8" stroke="#b59b66" strokeWidth=".9" d="M158 86C152 79 152 71 156 68C162 67 166 74 168 85L165 95Z" />
    <path fill="#f1deb0" stroke="#b59b66" strokeWidth=".9" d="M242 86C248 79 248 71 244 68C238 67 234 74 232 85L235 95Z" />
    <g clipPath={fill('hyoid-clip')} fill="none" strokeLinecap="round">
      <path stroke="#fffbe8" strokeWidth="2.1" strokeOpacity=".9" d="M99 59C103 81 115 95 134 98C148 101 157 94 167 96C186 102 214 102 233 96C243 94 252 101 266 98C285 95 297 81 301 59" />
      <path stroke="#a98c57" strokeWidth="1.05" strokeOpacity=".5" d="M157 107C175 113 184 113 198 113M202 113C216 113 225 113 243 107M109 99C125 105 138 105 153 100M247 100C262 105 275 105 291 99" />
      <path stroke="#b99d69" strokeWidth=".85" strokeOpacity=".45" d="M171 89C174 93 174 98 170 103M182 92C185 97 184 105 180 111M194 94C196 98 196 108 193 114M207 94C205 100 205 108 207 114M218 92C215 98 217 105 220 111M229 89C226 95 227 100 230 103" />
      {Array.from({ length: 20 }, (_, i) => <path key={i} stroke="#9e8556" strokeOpacity=".15" strokeWidth=".7" d={`M${168 + (i * 11) % 64} ${96 + (i * 7) % 13}l${1 + i % 2} ${i % 2 ? -1 : 1}`} />)}
    </g>
    <path fill="none" stroke="#b79b61" strokeWidth=".9" strokeOpacity=".5" d="M200 94C198 101 198 110 200 116" />
  </g>
}
