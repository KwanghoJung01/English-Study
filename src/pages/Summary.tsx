import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Badge, Button, Card } from '../components/ui'
import { useLessonFlow } from '../lib/lessonFlow'
import { useAppStore } from '../lib/store'
import { averageSpeakingAccuracy, scoreComprehension } from '../lib/scoring'
import { todayKey } from '../lib/streak'

export default function Summary() {
  const navigate = useNavigate()
  const { passage, isReview, comprehensionAnswers, sentenceAttempts, wordsLearned, reset } = useLessonFlow()
  const { addSession, addVocabEntries, state } = useAppStore()
  const savedRef = useRef(false)

  const reading = passage ? scoreComprehension(passage.questions, comprehensionAnswers) : null
  const speakingAvg = averageSpeakingAccuracy(sentenceAttempts)

  useEffect(() => {
    if (!passage || savedRef.current) return
    savedRef.current = true
    const r = scoreComprehension(passage.questions, comprehensionAnswers)
    addSession({
      date: todayKey(),
      level: passage.level,
      topic: passage.topic,
      topicLabel: passage.topicLabel,
      passageId: passage.id,
      passageTitle: passage.title,
      source: passage.source,
      readingScore: r.percent,
      readingTotal: r.total,
      readingCorrect: r.correct,
      speakingAccuracyAvg: speakingAvg,
      sentenceAttempts,
      wordsLearned,
      isReview,
    })
    if (passage.vocabulary.length > 0) {
      addVocabEntries(passage.vocabulary, passage.level)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage])

  if (!passage || !reading) {
    return (
      <FocusLayout title="학습 완료">
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          <p>진행 중인 학습이 없어요.</p>
          <Button onClick={() => navigate('/')}>홈으로</Button>
        </div>
      </FocusLayout>
    )
  }

  function handleFinish() {
    reset()
    navigate('/')
  }

  return (
    <FocusLayout title="학습 완료" onBack={handleFinish}>
      <div className="flex flex-col gap-4 p-4">
        <Card className="flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-600 to-indigo-500 text-center text-white">
          <p className="text-sm opacity-90">오늘도 수고했어요!</p>
          <p className="text-2xl font-extrabold">🔥 연속 {state.streak.current}일째</p>
          {isReview && <Badge tone="amber">복습 세션 (스트릭에는 영향 없음)</Badge>}
        </Card>

        <Card className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400">독해 정답률</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {reading.correct}/{reading.total} ({reading.percent}%)
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">스피킹 평균 정확도</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{speakingAvg}%</p>
          </div>
        </Card>

        {sentenceAttempts.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold">문장별 발화 정확도</p>
          <ul className="flex flex-col gap-1.5">
            {sentenceAttempts.map((a, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{a.sentence}</span>
                <span className="shrink-0 font-medium text-indigo-600 dark:text-indigo-400">{a.accuracy}%</span>
              </li>
            ))}
          </ul>
        </Card>
        )}

        {wordsLearned.length > 0 && (
          <Card>
            <p className="mb-2 text-sm font-semibold">오늘 배운 단어 ({wordsLearned.length}개)</p>
            <div className="flex flex-wrap gap-1.5">
              {wordsLearned.map((w) => (
                <Badge key={w} tone="slate">
                  {w}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <Button onClick={handleFinish}>홈으로 돌아가기</Button>
      </div>
    </FocusLayout>
  )
}
