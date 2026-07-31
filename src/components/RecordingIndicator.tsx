import { useEffect, useState } from 'react'

/** 녹음 중일 때 경과 시간을 1초 단위로 추적한다. */
export function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) {
      setSeconds(0)
      return
    }
    const startedAt = Date.now()
    setSeconds(0)
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250)
    return () => clearInterval(id)
  }, [active])

  return seconds
}

export function RecordingIndicator({ seconds, label = '듣고 있어요' }: { seconds: number; label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
      </span>
      {label} · {seconds}초
    </div>
  )
}
