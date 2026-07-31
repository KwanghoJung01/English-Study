import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'

export default function FocusLayout({
  title,
  onBack,
  children,
}: {
  title: string
  onBack?: () => void
  children: ReactNode
}) {
  const navigate = useNavigate()
  const { activeProfile } = useAppStore()

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => (onBack ? onBack() : navigate('/'))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ←
        </button>
        <h1 className="flex-1 text-base font-bold">{title}</h1>
        {activeProfile && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ background: activeProfile.color }}
          >
            {activeProfile.emoji} {activeProfile.name}
          </span>
        )}
      </header>
      <main className="flex-1 overflow-y-auto pb-8">{children}</main>
    </div>
  )
}
