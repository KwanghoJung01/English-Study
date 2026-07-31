import { useAppStore } from '../lib/store'
import { Button, Card, ProgressBar } from '../components/ui'
import { todayKey } from '../lib/streak'

export default function Family() {
  const { state, setActiveProfile, activeProfile } = useAppStore()
  const today = todayKey()

  if (state.profiles.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        아직 프로필이 없어요. 설정에서 가족 구성원을 먼저 추가해주세요.
      </div>
    )
  }

  const rows = state.profiles
    .map((p) => {
      const ps = state.profileStates[p.id]
      const sessions = ps?.sessions ?? []
      const nonReview = sessions.filter((s) => !s.isReview)
      const avgAccuracy = nonReview.length
        ? Math.round(nonReview.reduce((sum, s) => sum + s.speakingAccuracyAvg, 0) / nonReview.length)
        : 0
      const todayDone = sessions.some((s) => s.date === today && !s.isReview)
      return {
        profile: p,
        streak: ps?.streak.current ?? 0,
        longest: ps?.streak.longest ?? 0,
        totalSessions: nonReview.length,
        avgAccuracy,
        vocabCount: ps?.vocabulary.length ?? 0,
        todayDone,
      }
    })
    .sort((a, b) => b.streak - a.streak)

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">가족 구성원들의 학습 현황을 한눈에 비교해보세요.</p>
      {rows.map((r) => (
        <Card key={r.profile.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                style={{ background: `${r.profile.color}22` }}
              >
                {r.profile.emoji}
              </span>
              <div>
                <p className="text-sm font-bold">{r.profile.name}</p>
                <p className="text-[11px] text-slate-400">{r.todayDone ? '오늘 학습 완료 ✅' : '오늘 아직 학습 전'}</p>
              </div>
            </div>
            {activeProfile?.id !== r.profile.id && (
              <Button variant="ghost" onClick={() => setActiveProfile(r.profile.id)}>
                전환
              </Button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <MiniStat label="스트릭" value={`${r.streak}일`} />
            <MiniStat label="최고" value={`${r.longest}일`} />
            <MiniStat label="학습 횟수" value={`${r.totalSessions}회`} />
            <MiniStat label="단어장" value={`${r.vocabCount}개`} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>평균 스피킹 정확도</span>
              <span>{r.avgAccuracy}%</span>
            </div>
            <ProgressBar value={r.avgAccuracy} />
          </div>
        </Card>
      ))}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold">{value}</p>
      <p className="text-slate-400">{label}</p>
    </div>
  )
}
