import type { SVGProps } from 'react'

export type IconName = 'wave' | 'record' | 'stop' | 'import' | 'export' | 'play' | 'clear' | 'settings' | 'help' | 'book' | 'info' | 'close' | 'more' | 'mic' | 'arrow' | 'reset' | 'swap'

export function BrandMark() {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <defs><linearGradient id="voice-brand" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#f775ad" /><stop offset="1" stopColor="#58c8f3" /></linearGradient></defs>
    <rect width="64" height="64" rx="18" fill="url(#voice-brand)" />
    <path d="M12 28v8m10-17v26m10-33v40m10-33v26m10-17v8" stroke="white" strokeWidth="5" strokeLinecap="round" />
  </svg>
}

// 操作图标共用网格、线宽与端点，避免字符字体影响外观。
export function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {name === 'wave' && <path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4" />}
    {name === 'record' && <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />}
    {name === 'stop' && <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />}
    {name === 'import' && <><path d="M12 15V3m-4 4 4-4 4 4M4 14v6h16v-6" /></>}
    {name === 'export' && <path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4" />}
    {name === 'play' && <path d="m8 5 11 7-11 7Z" fill="currentColor" strokeWidth="1.5" />}
    {name === 'clear' && <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />}
    {name === 'settings' && <><path d="m10 3 4 0 .6 3 2 .9 2.6-1 2 3.4-2.3 2v2.4l2.3 2-2 3.4-2.7-1-2 .9-.5 3h-4l-.6-3-2-.9-2.6 1-2-3.4 2.3-2v-2.4l-2.3-2 2-3.4 2.7 1 2-.9Z" /><circle cx="12" cy="12" r="3" /></>}
    {name === 'help' && <><circle cx="12" cy="12" r="9" /><path d="M9.3 8.6a2.8 2.8 0 0 1 5.4 1c0 1.8-2.7 2-2.7 4" /><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" /></>}
    {name === 'book' && <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15" /></>}
    {name === 'info' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7" r="1.1" fill="currentColor" stroke="none" /></>}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'more' && <>{[5,12,19].map(x => <circle key={x} cx={x} cy="12" r="1.8" fill="currentColor" stroke="none" />)}</>}
    {name === 'mic' && <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-3 0h6" /></>}
    {name === 'arrow' && <path d="M6 18 18 6M7 6h11v11" />}
    {name === 'reset' && <path d="M4 10a8 8 0 1 1 1.6 7M4 4v6h6" />}
    {name === 'swap' && <path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" />}
  </svg>
}

export function ToolIcon({ id, active = false }: { id: string; active?: boolean }) {
  const name = id === 'record' ? active ? 'stop' : 'record' : id === 'playback' ? active ? 'stop' : 'play' : id === 'config' ? 'settings' : id === 'about' ? 'info' : id === 'help' ? 'book' : id as IconName
  return <Icon name={name} />
}
