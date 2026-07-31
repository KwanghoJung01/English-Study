import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '../lib/store'

const TABS = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/progress', label: '진행 기록', icon: '📊', end: false },
  { to: '/settings', label: '설정', icon: '⚙️', end: false },
]

export default function MainLayout() {
  const { syncStatus } = useAppStore()

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">매일 영어 스피킹</h1>
        <SyncBadge status={syncStatus} />
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-[480px] -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function SyncBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    idle: { text: '로컬 저장', cls: 'text-slate-400' },
    loading: { text: '불러오는 중…', cls: 'text-slate-400' },
    syncing: { text: 'GitHub 동기화 중…', cls: 'text-amber-500' },
    synced: { text: 'GitHub 동기화됨', cls: 'text-emerald-500' },
    error: { text: '동기화 오류', cls: 'text-rose-500' },
  }
  const info = map[status] ?? map.idle
  return <span className={`text-[11px] font-medium ${info.cls}`}>{info.text}</span>
}
