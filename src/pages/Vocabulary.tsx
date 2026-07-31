import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/FocusLayout'
import { Button, Card } from '../components/ui'
import { useLessonFlow } from '../lib/lessonFlow'
import { speak } from '../lib/speech'
import { useAppStore } from '../lib/store'

export default function Vocabulary() {
  const navigate = useNavigate()
  const { passage, setWordsLearned } = useLessonFlow()
  const { settings, activeProfile } = useAppStore()
  const ttsRate = activeProfile?.ttsRate ?? settings.ttsRate
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (!passage) {
    return (
      <FocusLayout title="단어 학습" step={2}>
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          <p>진행 중인 학습이 없어요.</p>
          <Button onClick={() => navigate('/lesson/setup')}>학습 설정으로 이동</Button>
        </div>
      </FocusLayout>
    )
  }

  const vocab = passage.vocabulary
  if (vocab.length === 0) {
    return (
      <FocusLayout title="단어 학습" step={2}>
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-slate-400">이 지문에는 등록된 핵심 단어가 없어요.</p>
          <Button onClick={() => navigate('/lesson/speaking')}>다음: 스피킹 연습</Button>
        </div>
      </FocusLayout>
    )
  }

  const current = vocab[index]
  const isLast = index === vocab.length - 1

  function handleNext() {
    if (!isLast) {
      setIndex((i) => i + 1)
      setRevealed(false)
    } else {
      setWordsLearned(vocab.map((v) => v.term))
      navigate('/lesson/speaking')
    }
  }

  return (
    <FocusLayout title="단어 학습" step={2}>
      <div className="flex flex-col gap-4 p-4">
        <p className="text-center text-xs text-slate-400">
          {index + 1} / {vocab.length}
        </p>
        <Card className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
          <button
            type="button"
            onClick={() => speak(current.term, ttsRate)}
            className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400"
          >
            {current.term} 🔊
          </button>
          {revealed ? (
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold">{current.meaning}</p>
              <p className="text-sm italic text-slate-500 dark:text-slate-400">"{current.example}"</p>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setRevealed(true)}>
              뜻 보기
            </Button>
          )}
        </Card>
        <Button onClick={handleNext} disabled={!revealed}>
          {isLast ? '다음: 스피킹 연습' : '다음 단어'}
        </Button>
      </div>
    </FocusLayout>
  )
}
