import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Badge, Button, Card } from '../components/ui'
import SpeedControl from '../components/SpeedControl'
import TranslationToggle from '../components/TranslationToggle'
import { useLessonFlow } from '../lib/lessonFlow'
import { useAppStore } from '../lib/store'
import { scoreComprehension } from '../lib/scoring'
import { createSentencePlayer, isTtsSupported, type PlaybackState, type SentencePlayerHandle } from '../lib/speech'

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

  // 해석 보기 토글. 입문 레벨은 아이 혼자 뜻을 파악하기 어려우니 기본으로 켜두고,
  // 그 외 레벨은 스스로 먼저 읽어보도록 기본은 꺼둔다.
  const [showTranslations, setShowTranslations] = useState(false)
  useEffect(() => {
    if (!passage) return
    setShowTranslations(passage.level === 'intro')
  }, [passage])

  const terms = useMemo(() => passage?.vocabulary.map((v) => v.term) ?? [], [passage])
  const sentenceHtmls = useMemo(
    () => (passage ? passage.sentences.map((s) => highlightVocab(s, terms)) : []),
    [passage, terms],
  )

  const ttsRateRef = useRef(ttsRate)
  useEffect(() => {
    ttsRateRef.current = ttsRate
  }, [ttsRate])

  const playerRef = useRef<SentencePlayerHandle | null>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [playingIndex, setPlayingIndex] = useState(0)

  useEffect(() => {
    if (!passage) return
    const player = createSentencePlayer(passage.sentences, () => ttsRateRef.current, {
      onStateChange: setPlaybackState,
      onSentenceChange: setPlayingIndex,
    })
    playerRef.current = player
    setPlaybackState('idle')
    setPlayingIndex(0)
    return () => {
      player.stop()
      playerRef.current = null
    }
  }, [passage])

  function handlePlayPause() {
    const player = playerRef.current
    if (!player) return
    if (playbackState === 'playing') player.pause()
    else player.play()
  }

  function handleStop() {
    playerRef.current?.stop()
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
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold">{passage.title}</h2>
            <TranslationToggle show={showTranslations} onToggle={() => setShowTranslations((s) => !s)} />
          </div>

          <div className="flex flex-col gap-3">
            {passage.sentences.map((_, i) => {
              const isActive = playbackState !== 'idle' && playingIndex === i
              return (
                <div
                  key={i}
                  className={`-mx-2 flex flex-col gap-1 rounded-lg px-2 py-1 transition-colors ${
                    isActive ? 'bg-indigo-50 dark:bg-indigo-950' : ''
                  }`}
                >
                  <p
                    className="text-base leading-relaxed text-slate-700 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: sentenceHtmls[i] }}
                  />
                  {showTranslations && passage.translations[i] && (
                    <p className="text-sm leading-relaxed text-slate-400 dark:text-slate-500">
                      {passage.translations[i]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={handlePlayPause} disabled={!isTtsSupported()}>
              {playbackState === 'playing'
                ? '⏸ 일시정지'
                : playbackState === 'paused'
                  ? '▶ 이어듣기'
                  : '🔊 원어민이 전체 읽어주기'}
            </Button>
            <Button variant="ghost" onClick={handleStop} disabled={playbackState === 'idle'}>
              ⏹ 정지
            </Button>
          </div>
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
