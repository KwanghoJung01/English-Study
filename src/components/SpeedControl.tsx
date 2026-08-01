import { TTS_SPEED_PRESETS } from '../types'

export default function SpeedControl({ rate, onChange }: { rate: number; onChange: (rate: number) => void }) {
  const closest = TTS_SPEED_PRESETS.reduce((best, p) =>
    Math.abs(p.rate - rate) < Math.abs(best.rate - rate) ? p : best,
  )

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="text-xs text-slate-400">듣기 속도</span>
      {TTS_SPEED_PRESETS.map((p) => {
        const active = p.rate === closest.rate
        return (
          <button
            key={p.rate}
            type="button"
            onClick={() => onChange(p.rate)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {p.emoji} {p.label}
          </button>
        )
      })}
    </div>
  )
}
