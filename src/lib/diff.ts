import type { WordDiffToken } from '../types'

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/** 문장의 단어 개수를 alignWords와 동일한 기준(구두점 제거 후 공백 분리)으로 센다. */
export function countWords(sentence: string): number {
  return normalize(sentence).length
}

/**
 * 목표 문장(target)과 인식된 발화(spoken)를 단어 단위로 정렬해
 * correct / wrong(치환) / missing(누락) / extra(추가) 태그를 매긴다.
 * 표준 편집거리(Levenshtein) 동적계획법의 backtrace를 이용한 정렬.
 */
export function alignWords(target: string, spoken: string): WordDiffToken[] {
  const a = normalize(target)
  const b = normalize(spoken)
  const n = a.length
  const m = b.length

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 0; i <= n; i++) dp[i][0] = i
  for (let j = 0; j <= m; j++) dp[0][j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const tokens: WordDiffToken[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      tokens.push({ word: a[i - 1], status: 'correct' })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      tokens.push({ word: a[i - 1], status: 'wrong' })
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      tokens.push({ word: a[i - 1], status: 'missing' })
      i--
    } else {
      tokens.push({ word: b[j - 1], status: 'extra' })
      j--
    }
  }
  tokens.reverse()
  return tokens
}

export function computeAccuracy(tokens: WordDiffToken[]): number {
  const targetTokens = tokens.filter((t) => t.status !== 'extra')
  if (targetTokens.length === 0) return 0
  const correct = targetTokens.filter((t) => t.status === 'correct').length
  return Math.round((correct / targetTokens.length) * 100)
}

export function computeWpm(wordCount: number, durationSec: number): number | null {
  if (durationSec <= 0) return null
  return Math.round((wordCount / durationSec) * 60)
}

/**
 * 지문 전체 문장을 이어 붙인 목표 문장에 대한 alignWords 결과(tokens)를,
 * 원래 문장 경계(sentenceWordCounts)에 따라 문장별로 다시 나눈다.
 * 'extra'(추가로 말한 단어) 토큰은 현재 진행 중인 문장 쪽에 포함시킨다.
 */
export function splitTokensBySentence(
  tokens: WordDiffToken[],
  sentenceWordCounts: number[],
): WordDiffToken[][] {
  const buckets: WordDiffToken[][] = sentenceWordCounts.map(() => [])
  let sentenceIndex = 0
  let consumed = 0

  for (const token of tokens) {
    const bucket = buckets[Math.min(sentenceIndex, buckets.length - 1)]
    bucket.push(token)
    if (token.status !== 'extra') {
      consumed++
      if (sentenceIndex < buckets.length && consumed >= sentenceWordCounts[sentenceIndex]) {
        sentenceIndex++
        consumed = 0
      }
    }
  }

  return buckets
}

export function paceFeedback(wpm: number | null): string {
  if (wpm === null) return ''
  if (wpm < 90) return '조금 천천히 읽었어요. 자연스러운 속도(110~150 WPM)에 도전해보세요.'
  if (wpm > 170) return '꽤 빠르게 읽었어요! 정확도를 위해 살짝 속도를 늦춰도 좋아요.'
  return '좋은 속도로 읽었어요.'
}
