import { FrameworkArt } from './larynxFrameworkArt'

interface MuscleProps { id: string; name: string; d: string; fibers: string[]; deep?: boolean }

function Muscle({ id, name, d, fibers, deep = false }: MuscleProps) {
  return <g>
    <clipPath id={`${id}-${name}`}><path d={d} /></clipPath>
    <path d={d} fill={`url(#${id}-${deep ? 'deep' : 'muscle'})`} stroke={deep ? '#996d68' : '#a86663'} strokeWidth="1.35" />
    <g clipPath={`url(#${id}-${name})`}>
      {fibers.map((fiber, index) => <path key={index} d={fiber} fill="none" stroke={index % 3 === 0 ? '#f8d5b9' : '#934e50'} strokeWidth={index % 3 === 0 ? .85 : .65} opacity={index % 3 === 0 ? .65 : .43} />)}
    </g>
  </g>
}

// 以原前下方观解剖图的肌束附着为依据，保留肌腹、腱与软骨的遮挡次序。
export function ExtrinsicArt({ id }: { id: string }) {
  const many = (n: number, make: (t: number, i: number) => string) => Array.from({ length: n }, (_, i) => make(i / (n - 1), i))
  return <g>
    <defs>
      <linearGradient id={`${id}-muscle`} x1="0" x2="1" y1="0" y2=".15"><stop stopColor="#ad6968" /><stop offset=".2" stopColor="#ce8a81" /><stop offset=".46" stopColor="#e3a999" /><stop offset=".73" stopColor="#c77f79" /><stop offset="1" stopColor="#9b5c5f" /></linearGradient>
      <linearGradient id={`${id}-deep`} x1="0" x2="1"><stop stopColor="#a36c67" /><stop offset=".22" stopColor="#c89988" /><stop offset=".52" stopColor="#dfb9a0" /><stop offset=".82" stopColor="#b78176" /><stop offset="1" stopColor="#945f61" /></linearGradient>
      <linearGradient id={`${id}-bone`} x1="0" y1="0" x2=".2" y2="1"><stop stopColor="#fff9e6" /><stop offset=".25" stopColor="#eadcc1" /><stop offset=".58" stopColor="#fff4d6" /><stop offset="1" stopColor="#c6b18b" /></linearGradient>
      <linearGradient id={`${id}-neck`} x1="0" x2="1"><stop stopColor="#e6d8c8" stopOpacity=".1" /><stop offset=".3" stopColor="#dbc9b7" stopOpacity=".5" /><stop offset=".52" stopColor="#f6ebdb" stopOpacity=".2" /><stop offset=".75" stopColor="#c8b49f" stopOpacity=".4" /><stop offset="1" stopColor="#e6d8c8" stopOpacity=".1" /></linearGradient>
      <linearGradient id={`${id}-gland`} x1="0" x2="1"><stop stopColor="#b57f72" /><stop offset=".35" stopColor="#d5b19b" /><stop offset=".65" stopColor="#e4c5a7" /><stop offset="1" stopColor="#a97870" /></linearGradient>
      <linearGradient id={`${id}-tendon`} x1="0" x2="1"><stop stopColor="#b6a88f" /><stop offset=".4" stopColor="#fff1d3" /><stop offset=".65" stopColor="#f1e1bd" /><stop offset="1" stopColor="#c2af8f" /></linearGradient>
      <linearGradient id={`${id}-posterior-fade`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="152" y2="233"><stop stopColor="#000" /><stop offset=".72" stopColor="#fff" /></linearGradient>
      <mask id={`${id}-posterior-mask`} maskUnits="userSpaceOnUse" x="295" y="145" width="110" height="182"><rect x="295" y="145" width="110" height="182" fill={`url(#${id}-posterior-fade)`} /></mask>
    </defs>

    <path d="M318 206C305 272 316 339 310 412C306 504 291 594 275 692C291 725 338 758 390 769L510 769C562 758 609 725 625 692C609 594 594 504 590 412C584 339 595 272 582 206C545 190 505 182 450 185C395 182 355 190 318 206Z" fill={`url(#${id}-neck)`} stroke="#d6c9ba" strokeWidth="1" />
    <path d="M322 220C323 269 317 334 310 397C302 480 291 563 281 656L274 694C286 707 302 719 319 728C329 654 337 583 347 512C358 432 365 356 354 289C348 256 336 232 322 220Z" fill="#d8cabb" fillOpacity=".48" stroke="#c6b7a8" strokeWidth=".8" />
    <path d="M578 220C577 269 583 334 590 397C598 480 609 563 619 656L626 694C614 707 598 719 581 728C571 654 563 583 553 512C542 432 535 356 546 289C552 256 564 232 578 220Z" fill="#d8cabb" fillOpacity=".48" stroke="#c6b7a8" strokeWidth=".8" />
    {many(13, t => `M${326 + t * 19} ${236 + t * 37}C${334 + t * 21} 393 ${300 + t * 25} 584 ${285 + t * 27} 700`).map((d, i) => <g key={`context-${i}`} fill="none" stroke="#aa9988" strokeWidth=".65" opacity=".22"><path d={d} /><path d={d} transform="translate(900 0) scale(-1 1)" /></g>)}

    <g transform="translate(290 240) scale(.8)"><FrameworkArt id={`${id}-framework`} /></g>
    <path d="M409 690L408 750Q450 762 492 750L491 690" fill="#e6e9df" stroke="#a8b6ae" strokeWidth="1.1" />
    {[697, 718, 739].map(y => <g key={y}><path d={`M409 ${y}Q450 ${y + 12} 491 ${y}L491 ${y + 12}Q450 ${y + 25} 409 ${y + 12}Z`} fill="#bfd1ce" stroke="#91aaa7" strokeWidth="1" /><path d={`M412 ${y + 3}Q450 ${y + 14} 488 ${y + 3}`} fill="none" stroke="#edf4eb" strokeWidth="1.2" /></g>)}

    <path d="M408 603C397 596 385 607 380 624C375 639 377 659 386 674C392 686 401 690 411 679L423 651C431 647 439 648 450 650C461 648 469 647 477 651L489 679C499 690 508 686 514 674C523 659 525 639 520 624C515 607 503 596 492 603L480 628C470 633 460 631 450 631C440 631 430 633 420 628Z" fill={`url(#${id}-gland)`} stroke="#a37f70" strokeWidth="1.2" />
    {many(32, (t, i) => `M${383 + (i % 8) * 4.2} ${615 + Math.floor(i / 8) * 15}q4 -5 9 0q-2 7 -8 8`).map((d, i) => <g key={`gland-${i}`} fill="none" stroke="#a3806b" opacity=".3" strokeWidth=".8"><path d={d} /><path d={d} transform="translate(900 0) scale(-1 1)" /></g>)}

    <path d="M415 752C426 744 437 751 450 750C463 751 474 744 485 752C492 766 490 783 495 803L483 820C462 824 438 824 417 820L405 803C410 783 408 766 415 752Z" fill={`url(#${id}-bone)`} stroke="#b39f82" strokeWidth="1.5" />
    <path d="M417 756C384 746 359 742 326 744C299 744 271 731 251 733C240 735 239 746 251 750C272 751 295 764 323 763C358 759 383 766 414 776Z" fill={`url(#${id}-bone)`} stroke="#b39f82" strokeWidth="1.4" />
    <path d="M483 756C516 746 541 742 574 744C601 744 629 731 649 733C660 735 661 746 649 750C628 751 605 764 577 763C542 759 517 766 486 776Z" fill={`url(#${id}-bone)`} stroke="#b39f82" strokeWidth="1.4" />
    <path d="M251 740C278 744 299 754 326 751C358 750 385 756 413 763M487 763C515 756 542 750 574 751C601 754 622 744 649 740" fill="none" stroke="#fff8e3" strokeWidth="2" strokeOpacity=".9" />

    <Muscle id={id} name="sternothyroid" deep d="M491 473C491 502 495 533 495 566C496 610 491 658 487 704C486 723 485 741 486 758C496 766 507 766 516 759C519 731 518 704 522 672C527 625 531 580 527 538C525 511 520 488 515 468C508 469 499 470 491 473Z" fibers={many(16, t => `M${493 + t * 21} ${473 - t * 4}C${505 + t * 20} 553 ${499 + t * 24} 654 ${489 + t * 25} 759`)} />
    <Muscle id={id} name="thyrohyoid" deep d="M485 332C486 349 485 371 484 392C482 420 484 451 491 472L515 467C511 443 508 420 509 395C510 371 510 349 505 331C499 329 491 329 485 332Z" fibers={many(13, t => `M${487 + t * 17} 332C${484 + t * 24} 373 ${484 + t * 24} 423 ${492 + t * 21} ${470 - t * 3}`)} />

    <Muscle id={id} name="cricothyroid" deep d="M459 526C470 525 477 530 481 540L491 561C482 568 470 571 458 568C456 555 456 539 459 526Z" fibers={many(12, t => `M${460 + t * 16} ${529 + t * 10}Q${468 + t * 12} 551 ${460 + t * 28} ${567 - t * 6}`)} />
    <Muscle id={id} name="sternohyoid" d="M415 332C407 370 410 408 410 448C411 499 407 550 401 600C394 659 386 706 386 755C391 763 404 769 417 769C422 730 425 687 429 644C436 580 440 521 439 462C439 418 442 372 435 332C429 328 422 328 415 332Z" fibers={many(18, t => `M${417 + t * 16} 333C${409 + t * 28} 416 ${417 + t * 23} 520 ${401 + t * 25} 646C${395 + t * 24} 693 ${388 + t * 26} 733 ${390 + t * 24} 760`)} />

    <Muscle id={id} name="omohyoid-upper" d="M385 333C371 367 361 405 352 446C343 486 331 535 324 579C324 585 330 590 338 586C350 547 365 508 377 467C389 425 398 378 400 334C396 330 390 330 385 333Z" fibers={many(11, t => `M${387 + t * 11} 335C${369 + t * 23} 416 ${351 + t * 24} 504 ${326 + t * 10} 581`)} />
    <path d="M329 583C325 597 322 609 311 626" fill="none" stroke="#b3a084" strokeWidth="9" strokeLinecap="round" /><path d="M329 583C325 597 322 609 311 626" fill="none" stroke={`url(#${id}-tendon)`} strokeWidth="6" strokeLinecap="round" />
    <Muscle id={id} name="omohyoid-lower" d="M311 623C293 633 280 646 264 658C241 674 218 690 196 708C195 713 201 721 207 723C234 710 262 698 285 680C302 666 317 649 320 635C319 630 316 626 311 623Z" fibers={many(12, t => `M${313 + t * 4} ${626 + t * 6}C${284 + t * 8} ${654 + t * 17} ${231 + t * 15} ${686 + t * 16} ${198 + t * 10} ${710 + t * 11}`)} />

    {/* 后腹由颞骨乳突切迹向前下行，先画在下颌后方；上端淡出表示超出本视野。 */}
    {[false, true].map(mirror => <g key={`posterior-${mirror}`} transform={mirror ? 'translate(900 0) scale(-1 1)' : undefined} mask={`url(#${id}-posterior-mask)`}>
      <Muscle id={id} name={`${mirror}-digastric-posterior`} d="M306 156C316 163 329 178 341 200C355 223 365 250 374 274C381 291 380 297 378 304L366 309C358 296 353 281 348 265C339 241 330 219 320 199C311 181 305 169 306 156Z" fibers={many(13, t => `M${307 + t * 8} ${158 + t * 7}C${329 + t * 15} 204 ${350 + t * 17} 268 ${368 + t * 8} 303`)} />
    </g>)}
    <path d="M304 220C319 187 330 155 360 125C388 98 416 79 440 77C450 76 456 78 464 82C497 85 525 108 546 136C569 167 582 195 596 225L578 239C564 213 548 192 526 173C503 154 477 140 452 139C427 140 399 154 377 173C355 192 338 215 324 239Z" fill={`url(#${id}-bone)`} stroke="#ae9772" strokeWidth="1.5" />
    <path d="M312 221C330 186 345 156 372 132C401 105 428 91 445 90C465 88 489 100 511 119C541 145 559 182 586 225" fill="none" stroke="#fff9e5" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M324 236C348 198 371 172 405 153C424 142 440 137 452 139C473 140 500 152 526 173C548 192 564 213 578 236" fill="none" stroke="#b29c77" strokeWidth="1.3" />
    {many(19, t => `M${357 + t * 179} ${147 - Math.sin(t * Math.PI) * 45}q-4 8 -3 14`).map((d, i) => <path key={`jaw-${i}`} d={d} fill="none" stroke="#9f8864" opacity=".2" strokeWidth=".75" />)}

    {[false, true].map(mirror => <g key={`supra-${mirror}`} transform={mirror ? 'translate(900 0) scale(-1 1)' : undefined}>
      <Muscle id={id} name={`${mirror}-mylohyoid`} deep d="M447 144C418 147 385 166 360 190C352 198 345 208 339 221C356 254 393 297 448 315C445 280 445 249 446 216C447 188 449 162 447 144Z" fibers={many(30, t => `M${341 + t * 102} ${219 - t * 74}C${374 + t * 69} ${245 - t * 85} ${416 + t * 31} ${292 - t * 119} 448 ${313 - t * 165}`)} />
      <Muscle id={id} name={`${mirror}-digastric-anterior`} d="M437 147C435 166 424 185 410 205C398 224 387 246 379 268C374 281 372 291 372 301L384 304C393 286 400 269 408 250C416 231 428 211 437 193C446 174 447 157 443 148Z" fibers={many(12, t => `M${438 + t * 6} ${150 + t * 3}C${441 + t * 1} 184 ${402 + t * 15} 237 ${375 + t * 7} 299`)} />
      <path d="M373 299C372 311 381 321 393 326" fill="none" stroke="#ad9a7e" strokeWidth="9" strokeLinecap="round" /><path d="M374 299C373 310 382 319 394 324" fill="none" stroke={`url(#${id}-tendon)`} strokeWidth="6" strokeLinecap="round" />
      <path d="M389 320Q392 334 402 336" fill="none" stroke="#d8c5a3" strokeWidth="3" />
    </g>)}
    <path d="M448 153C447 192 446 231 447 268C447 286 447 303 450 316" fill="none" stroke="#e3d4bb" strokeWidth="3" strokeLinecap="round" />
    <path d="M451 155C451 194 452 233 451 268C451 288 451 303 450 316" fill="none" stroke="#ad8d7f" strokeWidth=".65" opacity=".6" />
  </g>
}
