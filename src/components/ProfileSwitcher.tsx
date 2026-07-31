import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile } = useAppStore()
  const navigate = useNavigate()

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
      {profiles.map((p) => {
        const isActive = activeProfile?.id === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveProfile(p.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition ${
              isActive ? 'text-white' : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
            }`}
            style={isActive ? { borderColor: p.color, background: p.color } : undefined}
          >
            <span>{p.emoji}</span>
            <span>{p.name}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="shrink-0 rounded-full border-2 border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-400 dark:border-slate-700"
      >
        + 프로필 추가
      </button>
    </div>
  )
}
