import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Passage, SentenceAttempt, WholePassageReading } from '../types'

interface LessonFlowValue {
  passage: Passage | null
  isReview: boolean
  generationNote: string | null
  comprehensionAnswers: number[]
  sentenceAttempts: SentenceAttempt[]
  wholePassageReading: WholePassageReading | null
  wordsLearned: string[]
  startLesson: (passage: Passage, isReview: boolean, note: string | null) => void
  setComprehensionAnswers: (answers: number[]) => void
  addSentenceAttempt: (attempt: SentenceAttempt) => void
  setWholePassageReading: (reading: WholePassageReading) => void
  setWordsLearned: (words: string[]) => void
  reset: () => void
}

const LessonFlowContext = createContext<LessonFlowValue | null>(null)

export function LessonFlowProvider({ children }: { children: ReactNode }) {
  const [passage, setPassage] = useState<Passage | null>(null)
  const [isReview, setIsReview] = useState(false)
  const [generationNote, setGenerationNote] = useState<string | null>(null)
  const [comprehensionAnswers, setComprehensionAnswersState] = useState<number[]>([])
  const [sentenceAttempts, setSentenceAttempts] = useState<SentenceAttempt[]>([])
  const [wholePassageReading, setWholePassageReadingState] = useState<WholePassageReading | null>(null)
  const [wordsLearned, setWordsLearnedState] = useState<string[]>([])

  const startLesson = useCallback((p: Passage, review: boolean, note: string | null) => {
    setPassage(p)
    setIsReview(review)
    setGenerationNote(note)
    setComprehensionAnswersState(new Array(p.questions.length).fill(-1))
    setSentenceAttempts([])
    setWholePassageReadingState(null)
    setWordsLearnedState([])
  }, [])

  const setComprehensionAnswers = useCallback((answers: number[]) => {
    setComprehensionAnswersState(answers)
  }, [])

  const addSentenceAttempt = useCallback((attempt: SentenceAttempt) => {
    setSentenceAttempts((prev) => [...prev, attempt])
  }, [])

  const setWholePassageReading = useCallback((reading: WholePassageReading) => {
    setWholePassageReadingState(reading)
  }, [])

  const setWordsLearned = useCallback((words: string[]) => {
    setWordsLearnedState(words)
  }, [])

  const reset = useCallback(() => {
    setPassage(null)
    setIsReview(false)
    setGenerationNote(null)
    setComprehensionAnswersState([])
    setSentenceAttempts([])
    setWholePassageReadingState(null)
    setWordsLearnedState([])
  }, [])

  const value = useMemo<LessonFlowValue>(
    () => ({
      passage,
      isReview,
      generationNote,
      comprehensionAnswers,
      sentenceAttempts,
      wholePassageReading,
      wordsLearned,
      startLesson,
      setComprehensionAnswers,
      addSentenceAttempt,
      setWholePassageReading,
      setWordsLearned,
      reset,
    }),
    [
      passage,
      isReview,
      generationNote,
      comprehensionAnswers,
      sentenceAttempts,
      wholePassageReading,
      wordsLearned,
      startLesson,
      setComprehensionAnswers,
      addSentenceAttempt,
      setWholePassageReading,
      setWordsLearned,
      reset,
    ],
  )

  return <LessonFlowContext.Provider value={value}>{children}</LessonFlowContext.Provider>
}

export function useLessonFlow(): LessonFlowValue {
  const ctx = useContext(LessonFlowContext)
  if (!ctx) throw new Error('useLessonFlow must be used within LessonFlowProvider')
  return ctx
}
