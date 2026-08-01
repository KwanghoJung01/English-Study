import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Badge, Button, Card } from '../components/ui'
import SpeedControl from '../components/SpeedControl'
import { useLessonFlow } from '../lib/lessonFlow'
import { useAppStore } from '../lib/store'
import { scoreComprehension } from '../lib/scoring'
import { isTtsSupported, speak, stopSpeaking } from '../lib/speech'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightVocab(text: string, terms: string[]): string {
  const safeText = escapeHtml(text)
  if (terms.length === 0) return safeText
  const escapedTerms = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((t) => escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi')
  return safeText.replace(
    pattern,
    '<mark class="rounded bg-amber-100 px-0.5 text-inherit dark:bg-amber-900">$1</mark>',
  )
}

export default function Reading() {
  const navigate = useNavigate()
  const { passage, isReview, generationNote, comprehensionAnswers, setComprehensionAnswers } = useLessonFlow()
  const { settings, activeProfile, setTtsRate } = useAppStore()
  const ttsRate = activeProfile?.ttsRate ?? settings.ttsRate
  const [submitted, setSubmitted] = useState(false)
  const [listening, setListening] = useState(false)

  const terms = useMemo(() => passage?.vocabulary.map((v) => v.term) ?? [], [passage])
  const paragraphHtml = useMemo(
    () => (passage ? highlightVocab(passage.sentences.join(' '), terms) : ''),
    [passage, terms],
  )

  useEffect(() => {
    return () => stopSpeaking()
  }, [])

  async function handleListenPassage() {
    if (!passage) return
    setListening(true)
    try {
      await speak(passage.sentences.join(' '), ttsRate)
    } finally {
      setListening(false)
    }
  }

  if (!passage) {
    return (
      <FocusLayout title="독해" step={1}>
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          <p>진행 중인 학습이 없어요.</p>
          <Button onClick={() => navigate('/lesson/setup')}>학습 설정으로 이동</Button>
        </div>
      </FocusLayout>
    )
  }

  const result = scoreComprehension(passage.questions, comprehensionAnswers)
  const allAnswered = comprehensionAnswers.every((a) => a !== -1)

  function selectAnswer(qIndex: number, choiceIndex: number) {
    if (submitted) return
    const next = [...comprehensionAnswers]
    next[qIndex] = choiceIndex
    setComprehensionAnswers(next)
  }

  return (
    <FocusLayout title="독해" step={1}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Badge tone={passage.source === 'gemini' ? 'indigo' : 'slate'}>
            {passage.source === 'gemini' ? 'AI 생성' : '콘텐츠 뱅크'}
          </Badge>
          {isReview && <Badge tone="amber">복습</Badge>}
        </div>

        {generationNote && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {generationNote}
          </p>
        )}

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{passage.title}</h2>
          <p
            className="text-base leading-relaxed text-slate-700 dark:text-slate-200"
            dangerouslySetInnerHTML={{ __html: paragraphHtml }}
          />
          <Button variant="secondary" onClick={handleListenPassage} disabled={listening || !isTtsSupported()}>
            {listening ? '🔊 읽어주는 중…' : '🔊 원어민이 전체 읽어주기'}
          </Button>
          <SpeedControl rate={ttsRate} onChange={setTtsRate} />
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">이해도 확인</h2>
          {passage.questions.map((q, qi) => (
            <Card key={qi}>
              <p className="mb-2 text-sm font-medium">
                {qi + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-1.5">
                {q.choices.map((choice, ci) => {
                  const isSelected = comprehensionAnswers[qi] === ci
                  const isCorrectChoice = ci === q.answerIndex
                  let cls = 'border-slate-200 dark:border-slate-800'
                  if (submitted && isCorrectChoice) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                  else if (submitted && isSelected && !isCorrectChoice) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950'
                  else if (!submitted && isSelected) cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                  return (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => selectAnswer(qi, ci)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${cls}`}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </section>

        {!submitted ? (
          <Button disabled={!allAnswered} onClick={() => setSubmitted(true)}>
            {allAnswered ? '채점하기' : '모든 문제에 답해주세요'}
          </Button>
        ) : (
          <>
            <Card className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">독해 정답률</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {result.correct} / {result.total} ({result.percent}%)
              </p>
            </Card>
            <Button onClick={() => navigate('/lesson/vocabulary')}>다음: 단어 학습</Button>
          </>
        )}
      </div>
    </FocusLayout>
  )
}
