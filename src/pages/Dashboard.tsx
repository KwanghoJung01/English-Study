import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'
import { todayKey } from '../lib/streak'
import { dueVocab } from '../lib/srs'
import { Badge, Button, Card } from '../components/ui'

function startOfWeekKey(): string {
  const d = new Date()
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (day - 1))
  return todayKey(d)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { state, ready } = useAppStore()
  const today = todayKey()

  const todaySession = useMemo(
    () => state.sessions.find((s) => s.date === today && !s.isReview),
    [state.sessions, today],
  )

  const weekCount = useMemo(() => {
    const weekStart = startOfWeekKey()
    const seen = new Set<string>()
    state.sessions.forEach((s) => {
      if (s.date >= weekStart && !s.isReview) seen.add(s.date)
    })
    return seen.size
  }, [state.sessions])

  const due = useMemo(() => dueVocab(state.vocabulary, today), [state.vocabulary, today])

  if (!ready) {
    return <div className="p-6 text-center text-sm text-slate-400">불러오는 중…</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex items-center justify-between bg-gradient-to-br from-indigo-600 to-indigo-500 text-white">
        <div>
          <p className="text-xs opacity-80">연속 학습</p>
          <p className="text-3xl font-extrabold">🔥 {state.streak.current}일</p>
          <p className="mt-1 text-xs opacity-80">최고 기록 {state.streak.longest}일</p>
        </div>
        <div className="text-right text-xs opacity-90">
          <p>이번 주 {weekCount}/7일 학습</p>
          <p>단어장 {state.vocabulary.length}개</p>
        </div>
      </Card>

      {todaySession ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="emerald">오늘 완료</Badge>
            <span className="text-sm font-semibold">{todaySession.passageTitle}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            독해 정답률 {todaySession.readingScore}% · 스피킹 정확도 {todaySession.speakingAccuracyAvg}%
          </p>
          <Button variant="secondary" onClick={() => navigate('/lesson/setup', { state: { isReview: true } })}>
            복습 모드로 한 번 더 연습하기
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            오늘의 학습을 시작해보세요. 수준과 주제를 고르면 지문이 자동으로 생성돼요.
          </p>
          <Button onClick={() => navigate('/lesson/setup', { state: { isReview: false } })}>
            오늘의 학습 시작하기
          </Button>
        </Card>
      )}

      {due.length > 0 && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">복습할 단어 {due.length}개</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">간격 반복으로 오래 기억해요.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/progress')}>
            단어장 보기
          </Button>
        </Card>
      )}

      <Card>
        <p className="mb-2 text-sm font-semibold">최근 학습</p>
        {state.sessions.length === 0 ? (
          <p className="text-sm text-slate-400">아직 학습 기록이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {s.date} · {s.passageTitle}
                  {s.isReview && <span className="ml-1 text-xs text-slate-400">(복습)</span>}
                </span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{s.speakingAccuracyAvg}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
