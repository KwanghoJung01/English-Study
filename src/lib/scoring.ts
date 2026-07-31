import type { ComprehensionQuestion, SentenceAttempt } from '../types'

export function scoreComprehension(
  questions: ComprehensionQuestion[],
  answers: number[],
): { correct: number; total: number; percent: number } {
  const total = questions.length
  const correct = questions.reduce((sum, q, i) => (answers[i] === q.answerIndex ? sum + 1 : sum), 0)
  return { correct, total, percent: total === 0 ? 0 : Math.round((correct / total) * 100) }
}

export function averageSpeakingAccuracy(attempts: SentenceAttempt[]): number {
  if (attempts.length === 0) return 0
  const sum = attempts.reduce((acc, a) => acc + a.accuracy, 0)
  return Math.round(sum / attempts.length)
}
