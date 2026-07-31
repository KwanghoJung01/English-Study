import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'

const STEPS = ['독해', '단어학습', '스피킹 연습'] as const

export default function FocusLayout({
  title,
  onBack,
  step,
  children,
}: {
  title: string
  onBack?: () => void
  /** 1=독해, 2=단어학습, 3=스피킹 연습. 생략하면 진행 단계 표시를 숨긴다(설정/완료 화면 등). */
  step?: 1 | 2 | 3
  children: ReactNode
}) {
  const navigate = useNavigate()
  const { activeProfile } = useAppStore()

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3 px-4 py-3">
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
        </div>
        {step && (
          <div className="flex items-center gap-1.5 px-4 pb-3">
            {STEPS.map((label, i) => {
              const n = i + 1
              const state = n < step ? 'done' : n === step ? 'current' : 'upcoming'
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      state === 'upcoming' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] ${
                      state === 'current'
                        ? 'font-bold text-indigo-600 dark:text-indigo-400'
                        : state === 'done'
                          ? 'text-indigo-500'
                          : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto pb-8">{children}</main>
    </div>
  )
}
