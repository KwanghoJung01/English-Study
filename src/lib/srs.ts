import type { SrsBox, VocabEntry } from '../types'
import { todayKey } from './streak'

const INTERVAL_DAYS: Record<SrsBox, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00`)
  d.setDate(d.getDate() + days)
  return todayKey(d)
}

/** 단순화한 SM-2 스타일 간격 반복: 맞히면 박스 +1(최대 5), 틀리면 박스 0으로 리셋 */
export function reviewVocab(entry: VocabEntry, correct: boolean, today = todayKey()): VocabEntry {
  const nextBox: SrsBox = correct ? (Math.min(5, entry.srsBox + 1) as SrsBox) : 0
  return {
    ...entry,
    srsBox: nextBox,
    lastResult: correct ? 'correct' : 'wrong',
    reviewCount: entry.reviewCount + 1,
    nextReviewDate: addDays(today, INTERVAL_DAYS[nextBox] || 1),
  }
}

export function dueVocab(vocabulary: VocabEntry[], today = todayKey()): VocabEntry[] {
  return vocabulary.filter((v) => v.nextReviewDate <= today)
}
