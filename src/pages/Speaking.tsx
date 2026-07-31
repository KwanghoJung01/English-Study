import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Badge, Button, Card } from '../components/ui'
import { useLessonFlow } from '../lib/lessonFlow'
import { useAppStore } from '../lib/store'
import { isSttSupported, isTtsSupported, recordAndRecognize, speak } from '../lib/speech'
import { alignWords, computeAccuracy, computeWpm, paceFeedback } from '../lib/diff'
import type { WordDiffToken } from '../types'

type Phase = 'idle' | 'listening-tts' | 'recording' | 'result'

export default function Speaking() {
  const navigate = useNavigate()
  const { passage, sentenceAttempts, addSentenceAttempt } = useLessonFlow()
  const { settings, activeProfile } = useAppStore()
  const ttsRate = activeProfile?.ttsRate ?? settings.ttsRate

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [tokens, setTokens] = useState<WordDiffToken[] | null>(null)
  const [accuracy, setAccuracy] = useState(0)
  const [wpm, setWpm] = useState<number | null>(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ttsOk = useMemo(() => isTtsSupported(), [])
  const sttOk = useMemo(() => isSttSupported(), [])

  if (!passage) {
    return (
      <FocusLayout title="스피킹 연습">
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          <p>진행 중인 학습이 없어요.</p>
          <Button onClick={() => navigate('/lesson/setup')}>학습 설정으로 이동</Button>
        </div>
      </FocusLayout>
    )
  }

  const sentence = passage.sentences[index]
  const isLast = index === passage.sentences.length - 1

  async function handleListen() {
    setPhase('listening-tts')
    setError(null)
    try {
      await speak(sentence, ttsRate)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPhase('idle')
    }
  }

  async function handleRecord() {
    setPhase('recording')
    setError(null)
    try {
      const result = await recordAndRecognize(12)
      if (!result.transcript.trim()) {
        setError('말이 인식되지 않았어요. 버튼을 누른 직후 바로, 조금 더 또렷하게 말해보세요.')
        setPhase('idle')
        return
      }
      const diffTokens = alignWords(sentence, result.transcript)
      const acc = computeAccuracy(diffTokens)
      const wordCount = sentence.trim().split(/\s+/).length
      const pace = computeWpm(wordCount, result.durationSec)

      setTokens(diffTokens)
      setAccuracy(acc)
      setWpm(pace)
      setTranscript(result.transcript)
      setPhase('result')

      addSentenceAttempt({ sentence, transcript: result.transcript, accuracy: acc, wpm: pace, diff: diffTokens })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  function goNext() {
    setTokens(null)
    setTranscript('')
    setError(null)
    setPhase('idle')
    if (isLast) {
      navigate('/lesson/summary')
    } else {
      setIndex((i) => i + 1)
    }
  }

  const tokenColor: Record<WordDiffToken['status'], string> = {
    correct: 'text-emerald-600 dark:text-emerald-400',
    wrong: 'text-rose-600 dark:text-rose-400 line-through decoration-2',
    missing: 'text-slate-400 line-through decoration-2',
    extra: 'text-amber-500 italic',
  }

  return (
    <FocusLayout title="스피킹 연습">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-center text-xs text-slate-400">
          문장 {index + 1} / {passage.sentences.length}
        </p>

        {(!ttsOk || !sttOk) && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            이 브라우저는 음성 {ttsOk ? '' : '합성'} {!ttsOk && !sttOk ? '및 ' : ''}
            {sttOk ? '' : '인식'} 기능을 지원하지 않을 수 있어요. 최신 Android Chrome에서 사용해주세요.
          </p>
        )}

        <Card>
          <p className="text-lg font-semibold leading-relaxed">{sentence}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleListen} disabled={phase === 'listening-tts' || !ttsOk}>
            🔊 원어민 듣기
          </Button>
          <Button onClick={handleRecord} disabled={phase === 'recording' || !sttOk}>
            {phase === 'recording' ? '🎙 녹음 중…' : '🎙 내 리딩 녹음'}
          </Button>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        )}

        {phase === 'result' && tokens && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge tone={accuracy >= 80 ? 'emerald' : accuracy >= 50 ? 'amber' : 'slate'}>정확도 {accuracy}%</Badge>
              {wpm !== null && <span className="text-xs text-slate-400">{wpm} WPM</span>}
            </div>
            <p className="flex flex-wrap gap-1 text-base leading-relaxed">
              {tokens.map((t, i) => (
                <span key={i} className={tokenColor[t.status]}>
                  {t.word}
                </span>
              ))}
            </p>
            <p className="text-xs text-slate-400">
              녹색: 정확 · 취소선 빨강: 다르게 발음 · 취소선 회색: 누락 · 주황 기울임: 추가로 말한 단어
            </p>
            {transcript && (
              <p className="text-xs text-slate-500 dark:text-slate-400">인식된 내용: "{transcript}"</p>
            )}
            {wpm !== null && <p className="text-sm text-indigo-600 dark:text-indigo-400">{paceFeedback(wpm)}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleRecord}>
                다시 녹음
              </Button>
              <Button className="flex-1" onClick={goNext}>
                {isLast ? '학습 완료' : '다음 문장'}
              </Button>
            </div>
          </Card>
        )}

        {phase !== 'result' && sentenceAttempts.length > 0 && (
          <p className="text-center text-xs text-slate-400">지금까지 평균 정확도: {Math.round(
            sentenceAttempts.reduce((s, a) => s + a.accuracy, 0) / sentenceAttempts.length,
          )}%</p>
        )}
      </div>
    </FocusLayout>
  )
}
