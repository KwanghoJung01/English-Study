import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Badge, Button, Card } from '../components/ui'
import { RecordingIndicator, useElapsedSeconds } from '../components/RecordingIndicator'
import { useLessonFlow } from '../lib/lessonFlow'
import { useAppStore } from '../lib/store'
import {
  isSttSupported,
  isTtsSupported,
  recordAndRecognize,
  speak,
  startContinuousRecognition,
  type ContinuousRecording,
} from '../lib/speech'
import { alignWords, computeAccuracy, computeWpm, countWords, paceFeedback, splitTokensBySentence } from '../lib/diff'
import type { WordDiffToken } from '../types'

type Phase = 'idle' | 'listening-tts' | 'recording' | 'result'
type Stage = 'sentences' | 'whole'

const TOKEN_COLOR: Record<WordDiffToken['status'], string> = {
  correct: 'text-emerald-600 dark:text-emerald-400',
  wrong: 'text-rose-600 dark:text-rose-400 line-through decoration-2',
  missing: 'text-slate-400 line-through decoration-2',
  extra: 'text-amber-500 italic',
}

function TokenText({ tokens }: { tokens: WordDiffToken[] }) {
  return (
    <p className="flex flex-wrap gap-1.5 text-lg leading-relaxed">
      {tokens.map((t, i) => (
        <span key={i} className={TOKEN_COLOR[t.status]}>
          {t.word}
        </span>
      ))}
    </p>
  )
}

export default function Speaking() {
  const navigate = useNavigate()
  const { passage, sentenceAttempts, addSentenceAttempt, setWholePassageReading } = useLessonFlow()
  const { settings, activeProfile } = useAppStore()
  const ttsRate = activeProfile?.ttsRate ?? settings.ttsRate

  const [stage, setStage] = useState<Stage>('sentences')

  // 문장별 연습 상태
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [tokens, setTokens] = useState<WordDiffToken[] | null>(null)
  const [accuracy, setAccuracy] = useState(0)
  const [wpm, setWpm] = useState<number | null>(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 전체 지문 한번에 읽기 상태
  const [wholePhase, setWholePhase] = useState<Phase>('idle')
  const [wholeError, setWholeError] = useState<string | null>(null)
  const [wholeLiveTranscript, setWholeLiveTranscript] = useState('')
  const [wholeTranscript, setWholeTranscript] = useState('')
  const [wholeDuration, setWholeDuration] = useState(0)
  const [wholeWpm, setWholeWpm] = useState<number | null>(null)
  const [wholeAccuracy, setWholeAccuracy] = useState(0)
  const [wholeSentenceTokens, setWholeSentenceTokens] = useState<WordDiffToken[][]>([])
  const wholeRecordingRef = useRef<ContinuousRecording | null>(null)

  const sentenceElapsed = useElapsedSeconds(phase === 'recording')
  const wholeElapsed = useElapsedSeconds(wholePhase === 'recording')

  const ttsOk = useMemo(() => isTtsSupported(), [])
  const sttOk = useMemo(() => isSttSupported(), [])

  if (!passage) {
    return (
      <FocusLayout title="스피킹 연습" step={3}>
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
      const pace = computeWpm(countWords(sentence), result.durationSec)

      setTokens(diffTokens)
      setAccuracy(acc)
      setWpm(pace)
      setTranscript(result.transcript)
      setPhase('result')

      addSentenceAttempt({
        sentence,
        transcript: result.transcript,
        accuracy: acc,
        wpm: pace,
        diff: diffTokens,
        stage: 'single',
      })
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
      setStage('whole')
    } else {
      setIndex((i) => i + 1)
    }
  }

  const fullText = passage.sentences.join(' ')

  async function handleWholeListen() {
    setWholePhase('listening-tts')
    setWholeError(null)
    try {
      await speak(fullText, ttsRate)
    } catch (err) {
      setWholeError(err instanceof Error ? err.message : String(err))
    } finally {
      setWholePhase('idle')
    }
  }

  function handleWholeRecordStart() {
    if (!passage) return
    setWholePhase('recording')
    setWholeError(null)
    setWholeLiveTranscript('')
    const maxDurationSec = Math.max(40, passage.sentences.length * 10)
    const handle = startContinuousRecognition(maxDurationSec, (soFar) => setWholeLiveTranscript(soFar))
    wholeRecordingRef.current = handle

    handle.result
      .then((result) => {
        if (!result.transcript.trim()) {
          setWholeError('말이 인식되지 않았어요. 시작 버튼을 누른 직후 바로, 조금 더 또렷하게 읽어보세요.')
          setWholePhase('idle')
          return
        }
        const diffTokens = alignWords(fullText, result.transcript)
        const wordCounts = passage.sentences.map(countWords)
        const perSentenceTokens = splitTokensBySentence(diffTokens, wordCounts)
        const pace = computeWpm(countWords(fullText), result.durationSec)

        setWholeSentenceTokens(perSentenceTokens)
        setWholeAccuracy(computeAccuracy(diffTokens))
        setWholeWpm(pace)
        setWholeDuration(result.durationSec)
        setWholeTranscript(result.transcript)
        setWholePhase('result')
      })
      .catch((err) => {
        setWholeError(err instanceof Error ? err.message : String(err))
        setWholePhase('idle')
      })
  }

  function handleWholeRecordStop() {
    wholeRecordingRef.current?.stop()
  }

  function finishWholeStage() {
    if (!passage) return
    const sentenceAccuracies = wholeSentenceTokens.map((t) => computeAccuracy(t))
    passage.sentences.forEach((s, i) => {
      addSentenceAttempt({
        sentence: s,
        transcript: '',
        accuracy: sentenceAccuracies[i] ?? 0,
        wpm: wholeWpm,
        diff: wholeSentenceTokens[i] ?? [],
        stage: 'whole',
      })
    })
    setWholePassageReading({
      transcript: wholeTranscript,
      durationSec: wholeDuration,
      wpm: wholeWpm,
      accuracy: wholeAccuracy,
      sentenceAccuracies,
    })
    navigate('/lesson/summary')
  }

  if (stage === 'whole') {
    return (
      <FocusLayout title="스피킹 연습" step={3}>
        <div className="flex flex-col gap-4 p-4">
          <Badge tone="indigo">마지막 단계 · 전체 지문 한번에 읽기</Badge>

          {(!ttsOk || !sttOk) && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              이 브라우저는 음성 기능을 온전히 지원하지 않을 수 있어요. 최신 Android Chrome에서 사용해주세요.
            </p>
          )}

          <Card>
            <p className="text-lg leading-loose text-slate-700 dark:text-slate-200">{fullText}</p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={handleWholeListen} disabled={wholePhase !== 'idle' || !ttsOk}>
              🔊 전체 듣기
            </Button>
            {wholePhase === 'recording' ? (
              <Button variant="danger" onClick={handleWholeRecordStop}>
                🛑 다 읽었어요
              </Button>
            ) : (
              <Button onClick={handleWholeRecordStart} disabled={wholePhase === 'listening-tts' || !sttOk}>
                🎙 전체 읽기 시작
              </Button>
            )}
          </div>

          {wholePhase === 'recording' && (
            <div className="flex flex-col gap-2">
              <RecordingIndicator seconds={wholeElapsed} label="듣고 있어요" />
              <p className="text-center text-xs text-slate-400">
                다 읽으면 위의 "🛑 다 읽었어요"를 눌러서 끝내주세요. 문장 사이에 잠깐 멈춰도 계속 들어요.
              </p>
              {wholeLiveTranscript && (
                <Card className="bg-slate-50 dark:bg-slate-800">
                  <p className="mb-1 text-[11px] font-semibold text-slate-400">지금까지 인식된 내용</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{wholeLiveTranscript}</p>
                </Card>
              )}
            </div>
          )}

          {wholeError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              {wholeError}
            </p>
          )}

          {wholePhase === 'result' && (
            <Card className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={wholeAccuracy >= 80 ? 'emerald' : wholeAccuracy >= 50 ? 'amber' : 'slate'}>
                  전체 정확도 {wholeAccuracy}%
                </Badge>
                <Badge tone="slate">읽은 시간 {wholeDuration.toFixed(1)}초</Badge>
                {wholeWpm !== null && <Badge tone="slate">{wholeWpm} WPM</Badge>}
              </div>
              {wholeWpm !== null && <p className="text-sm text-indigo-600 dark:text-indigo-400">{paceFeedback(wholeWpm)}</p>}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">문장별 발음 체크</p>
                {passage.sentences.map((_, i) => {
                  const sentTokens = wholeSentenceTokens[i] ?? []
                  const sentAcc = computeAccuracy(sentTokens)
                  return (
                    <div key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-slate-400">문장 {i + 1}</span>
                        <Badge tone={sentAcc >= 80 ? 'emerald' : sentAcc >= 50 ? 'amber' : 'slate'}>{sentAcc}%</Badge>
                      </div>
                      <TokenText tokens={sentTokens} />
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleWholeRecordStart}>
                  다시 읽기
                </Button>
                <Button className="flex-1" onClick={finishWholeStage}>
                  학습 완료
                </Button>
              </div>
            </Card>
          )}
        </div>
      </FocusLayout>
    )
  }

  return (
    <FocusLayout title="스피킹 연습" step={3}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-slate-400">
            문장 {index + 1} / {passage.sentences.length}
          </p>
          <div className="flex w-full gap-1">
            {passage.sentences.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>
        </div>

        {(!ttsOk || !sttOk) && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            이 브라우저는 음성 {ttsOk ? '' : '합성'} {!ttsOk && !sttOk ? '및 ' : ''}
            {sttOk ? '' : '인식'} 기능을 지원하지 않을 수 있어요. 최신 Android Chrome에서 사용해주세요.
          </p>
        )}

        <Card>
          <p className="text-xl font-semibold leading-relaxed">{sentence}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleListen} disabled={phase === 'listening-tts' || !ttsOk}>
            🔊 원어민 듣기
          </Button>
          <Button onClick={handleRecord} disabled={phase === 'recording' || !sttOk}>
            🎙 내 리딩 녹음
          </Button>
        </div>

        {phase === 'recording' && <RecordingIndicator seconds={sentenceElapsed} label="녹음 중" />}

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
            <TokenText tokens={tokens} />
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
                {isLast ? '다음: 전체 읽기 연습' : '다음 문장'}
              </Button>
            </div>
          </Card>
        )}

        {phase !== 'result' && sentenceAttempts.length > 0 && (
          <p className="text-center text-xs text-slate-400">
            지금까지 평균 정확도:{' '}
            {Math.round(sentenceAttempts.reduce((s, a) => s + a.accuracy, 0) / sentenceAttempts.length)}%
          </p>
        )}
      </div>
    </FocusLayout>
  )
}
