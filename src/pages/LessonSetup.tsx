import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Button, Card } from '../components/ui'
import { useAppStore } from '../lib/store'
import { useLessonFlow } from '../lib/lessonFlow'
import { generatePassage } from '../lib/generation'
import { BANK_TOPICS, INTRO_TOPIC_IDS, LEVELS, type Level, type TopicId } from '../types'

export default function LessonSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const isReview = Boolean((location.state as { isReview?: boolean } | null)?.isReview)
  const { settings, activeProfile, activeProfileState } = useAppStore()
  const { startLesson } = useLessonFlow()

  const [level, setLevel] = useState<Level>(activeProfile?.level ?? settings.defaultLevel)
  const [topic, setTopic] = useState<TopicId>('daily-life')
  const [customTopic, setCustomTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bankOnly = settings.generationMode === 'bank' || !settings.geminiApiKey.trim()
  const useCustom = topic === 'custom' && !bankOnly
  const availableTopics = level === 'intro' ? BANK_TOPICS.filter((t) => INTRO_TOPIC_IDS.includes(t.id)) : BANK_TOPICS

  function handleSelectLevel(next: Level) {
    setLevel(next)
    if (next === 'intro' && !INTRO_TOPIC_IDS.includes(topic)) {
      setTopic('daily-life')
    }
  }

  const recentBankKeys = useMemo(
    () =>
      (activeProfileState?.sessions ?? [])
        .filter((s) => s.source === 'bank')
        .slice(0, 10)
        .map((s) => s.passageId),
    [activeProfileState],
  )

  if (!activeProfile) {
    return (
      <FocusLayout title="학습 설정">
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          <p>먼저 학습할 사람의 프로필을 선택해주세요.</p>
          <Button onClick={() => navigate('/')}>홈으로</Button>
        </div>
      </FocusLayout>
    )
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const topicLabel = useCustom ? customTopic.trim() || '자유 주제' : BANK_TOPICS.find((t) => t.id === topic)?.label ?? topic
      const result = await generatePassage(settings, level, topic, topicLabel, recentBankKeys)
      startLesson(result.passage, isReview, result.note)
      navigate('/lesson/reading')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <FocusLayout title={isReview ? '복습 학습 설정' : '오늘의 학습 설정'}>
      <div className="flex flex-col gap-5 p-4">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">수준 선택</h2>
          <div className="flex flex-col gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => handleSelectLevel(l.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  level === l.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">{l.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{l.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">주제 선택</h2>
          {level === 'intro' && (
            <p className="mb-2 text-xs text-slate-400">입문 단계는 아이 눈높이에 맞는 주제만 보여드려요.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {availableTopics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                className={`rounded-xl border p-3 text-sm font-medium transition ${
                  topic === t.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
            {level !== 'intro' && (
              <button
                type="button"
                disabled={bankOnly}
                onClick={() => setTopic('custom')}
                className={`rounded-xl border p-3 text-sm font-medium transition disabled:opacity-40 ${
                  topic === 'custom'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                직접 입력 {bankOnly && '(Gemini 키 필요)'}
              </button>
            )}
          </div>
          {useCustom && (
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="예: 반려동물, 우주 탐사, 재택근무 팁…"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-800"
            />
          )}
        </section>

        <Card className="text-xs text-slate-500 dark:text-slate-400">
          {settings.generationMode === 'bank'
            ? '콘텐츠 뱅크 모드: 내장된 지문 중에서 선택해 즉시 생성돼요.'
            : settings.geminiApiKey.trim()
              ? 'Gemini 2.5 Flash로 매번 새로운 지문을 생성해요. 실패하면 콘텐츠 뱅크로 자동 대체됩니다.'
              : 'Gemini API 키가 없어 콘텐츠 뱅크 지문을 사용해요. 설정에서 키를 등록하면 매번 새 지문을 받을 수 있어요.'}
        </Card>

        {error && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        )}

        <Button onClick={handleGenerate} disabled={loading || (useCustom && !customTopic.trim())}>
          {loading ? '지문 생성 중…' : '지문 생성하기'}
        </Button>
      </div>
    </FocusLayout>
  )
}
