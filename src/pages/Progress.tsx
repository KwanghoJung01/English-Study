import { useMemo, useState } from 'react'
import { useAppStore } from '../lib/store'
import { dueVocab } from '../lib/srs'
import { todayKey } from '../lib/streak'
import { Badge, Button, Card, ProgressBar } from '../components/ui'
import type { VocabEntry } from '../types'

export default function Progress() {
  const { activeProfile, activeProfileState, reviewVocab } = useAppStore()
  const today = todayKey()
  const sessions = useMemo(() => activeProfileState?.sessions ?? [], [activeProfileState])
  const vocabulary = useMemo(() => activeProfileState?.vocabulary ?? [], [activeProfileState])
  const streak = activeProfileState?.streak ?? { current: 0, longest: 0, lastCompletedDate: null }
  const due = useMemo(() => dueVocab(vocabulary, today), [vocabulary, today])
  const recentSessions = sessions.slice(0, 20)

  if (!activeProfile) {
    return <div className="p-6 text-center text-sm text-slate-400">위에서 학습할 사람을 먼저 선택해주세요.</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="grid grid-cols-3 gap-2 text-center">
        <Stat label="현재 스트릭" value={`${streak.current}일`} />
        <Stat label="최고 스트릭" value={`${streak.longest}일`} />
        <Stat label="총 학습 횟수" value={`${sessions.filter((s) => !s.isReview).length}회`} />
      </Card>

      {recentSessions.length > 0 && (
        <Card>
          <p className="mb-3 text-sm font-semibold">최근 정확도 추이</p>
          <div className="flex flex-col gap-2">
            {recentSessions
              .slice(0, 8)
              .reverse()
              .map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-slate-400">{s.date.slice(5)}</span>
                  <div className="flex-1">
                    <ProgressBar value={s.speakingAccuracyAvg} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-medium text-indigo-600 dark:text-indigo-400">
                    {s.speakingAccuracyAvg}%
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      <VocabSection due={due} totalCount={vocabulary.length} onReview={reviewVocab} />

      <Card>
        <p className="mb-2 text-sm font-semibold">학습 기록 전체</p>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-slate-400">아직 기록이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-700 dark:text-slate-200">
                    {s.date} · {s.passageTitle}
                    {s.isReview && <span className="ml-1 text-xs text-slate-400">(복습)</span>}
                  </span>
                  <span className="text-xs text-slate-400">
                    {s.topicLabel} · 독해 {s.readingScore}%
                  </span>
                </div>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{s.speakingAccuracyAvg}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  )
}

function VocabSection({
  due,
  totalCount,
  onReview,
}: {
  due: VocabEntry[]
  totalCount: number
  onReview: (id: string, correct: boolean) => void
}) {
  const [cursor, setCursor] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const current = due[cursor]

  function handleAnswer(correct: boolean) {
    if (!current) return
    onReview(current.id, correct)
    setRevealed(false)
    setCursor((c) => c + 1)
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">단어장 ({totalCount}개)</p>
        {due.length > 0 && <Badge tone="amber">복습 대기 {due.length}개</Badge>}
      </div>
      {due.length === 0 || !current ? (
        <p className="text-sm text-slate-400">오늘 복습할 단어가 없어요. 잘 하고 있어요!</p>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
          <p className="text-xs text-slate-400">
            {cursor + 1} / {due.length}
          </p>
          <p className="text-xl font-bold">{current.term}</p>
          {revealed ? (
            <>
              <p className="text-sm">{current.meaning}</p>
              <p className="text-xs italic text-slate-500 dark:text-slate-400">"{current.example}"</p>
              <div className="flex w-full gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => handleAnswer(false)}>
                  몰라요
                </Button>
                <Button className="flex-1" onClick={() => handleAnswer(true)}>
                  알아요
                </Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setRevealed(true)}>
              뜻 보기
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
