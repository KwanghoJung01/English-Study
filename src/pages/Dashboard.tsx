import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'
import { todayKey } from '../lib/streak'
import { dueVocab } from '../lib/srs'
import { Badge, Button, Card } from '../components/ui'
import { LEVELS, PROFILE_COLORS, PROFILE_EMOJIS, type Level } from '../types'

function startOfWeekKey(): string {
  const d = new Date()
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (day - 1))
  return todayKey(d)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { ready, profiles, activeProfile, activeProfileState, createProfile } = useAppStore()
  const today = todayKey()

  const sessions = useMemo(() => activeProfileState?.sessions ?? [], [activeProfileState])
  const vocabulary = useMemo(() => activeProfileState?.vocabulary ?? [], [activeProfileState])
  const streak = activeProfileState?.streak ?? { current: 0, longest: 0, lastCompletedDate: null }

  const todaySession = useMemo(() => sessions.find((s) => s.date === today && !s.isReview), [sessions, today])

  const weekCount = useMemo(() => {
    const weekStart = startOfWeekKey()
    const seen = new Set<string>()
    sessions.forEach((s) => {
      if (s.date >= weekStart && !s.isReview) seen.add(s.date)
    })
    return seen.size
  }, [sessions])

  const due = useMemo(() => dueVocab(vocabulary, today), [vocabulary, today])

  if (!ready) {
    return <div className="p-6 text-center text-sm text-slate-400">불러오는 중…</div>
  }

  if (profiles.length === 0) {
    return <FirstProfileSetup onCreate={createProfile} />
  }

  if (!activeProfile) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        위에서 학습할 사람을 선택해주세요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card
        className="flex items-center justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${activeProfile.color}, ${activeProfile.color}cc)` }}
      >
        <div>
          <p className="text-xs opacity-80">
            {activeProfile.emoji} {activeProfile.name}의 연속 학습
          </p>
          <p className="text-3xl font-extrabold">🔥 {streak.current}일</p>
          <p className="mt-1 text-xs opacity-80">최고 기록 {streak.longest}일</p>
        </div>
        <div className="text-right text-xs opacity-90">
          <p>이번 주 {weekCount}/7일 학습</p>
          <p>단어장 {vocabulary.length}개</p>
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
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400">아직 학습 기록이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.slice(0, 5).map((s) => (
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

function FirstProfileSetup({
  onCreate,
}: {
  onCreate: (input: { name: string; emoji: string; color: string; level: Level }) => string
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string>(PROFILE_EMOJIS[0])
  const [color, setColor] = useState<string>(PROFILE_COLORS[0])
  const [level, setLevel] = useState<Level>('beginner')

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <h2 className="mb-1 text-base font-bold">환영해요! 👋</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          가족이 함께 쓸 수 있어요. 먼저 학습할 사람의 프로필을 만들어주세요. (나중에 설정에서 더 추가할 수 있어요)
        </p>

        <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">이름 / 별명</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 민준이, 엄마"
          className="mb-3 w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">아이콘</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {PROFILE_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg ${
                emoji === e ? 'border-indigo-500' : 'border-transparent bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">색상</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">기본 수준</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label} — {l.hint}
            </option>
          ))}
        </select>

        <Button disabled={!name.trim()} onClick={() => onCreate({ name, emoji, color, level })}>
          프로필 만들고 시작하기
        </Button>
      </Card>
    </div>
  )
}
