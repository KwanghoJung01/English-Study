export type Level = 'beginner' | 'intermediate' | 'advanced'

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'beginner', label: '초급', hint: '짧고 쉬운 문장, 기본 어휘 (CEFR A1~A2)' },
  { id: 'intermediate', label: '중급', hint: '일상 대화 수준의 문장과 어휘 (CEFR B1~B2)' },
  { id: 'advanced', label: '고급', hint: '풍부한 어휘와 복문 구조 (CEFR C1)' },
]

export type TopicId =
  | 'daily-life'
  | 'travel'
  | 'business'
  | 'current-events'
  | 'hobbies'
  | 'food'
  | 'custom'

export const BANK_TOPICS: { id: TopicId; label: string }[] = [
  { id: 'daily-life', label: '일상생활' },
  { id: 'travel', label: '여행' },
  { id: 'business', label: '비즈니스/업무' },
  { id: 'current-events', label: '시사/뉴스' },
  { id: 'hobbies', label: '취미/관심사' },
  { id: 'food', label: '음식/요리' },
]

export interface VocabItem {
  term: string
  meaning: string
  example: string
}

export interface ComprehensionQuestion {
  question: string
  choices: string[]
  answerIndex: number
}

export interface Passage {
  id: string
  level: Level
  topic: TopicId
  topicLabel: string
  title: string
  sentences: string[]
  vocabulary: VocabItem[]
  questions: ComprehensionQuestion[]
  source: 'gemini' | 'bank'
}

export interface WordDiffToken {
  word: string
  status: 'correct' | 'wrong' | 'missing' | 'extra'
}

export interface SentenceAttempt {
  sentence: string
  transcript: string
  accuracy: number
  wpm: number | null
  diff: WordDiffToken[]
}

export interface LessonSession {
  id: string
  date: string // YYYY-MM-DD (로컬 기준)
  completedAt: string // ISO timestamp
  level: Level
  topic: TopicId
  topicLabel: string
  passageId: string
  passageTitle: string
  source: 'gemini' | 'bank'
  readingScore: number // 0~100
  readingTotal: number
  readingCorrect: number
  speakingAccuracyAvg: number // 0~100
  sentenceAttempts: SentenceAttempt[]
  wordsLearned: string[]
  isReview: boolean
}

export type SrsBox = 0 | 1 | 2 | 3 | 4 | 5

export interface VocabEntry extends VocabItem {
  id: string
  level: Level
  addedDate: string
  srsBox: SrsBox
  nextReviewDate: string
  lastResult: 'correct' | 'wrong' | null
  reviewCount: number
}

export interface StreakInfo {
  current: number
  longest: number
  lastCompletedDate: string | null
}

export type GenerationMode = 'auto' | 'gemini' | 'bank'

export interface Settings {
  geminiApiKey: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
  generationMode: GenerationMode
  defaultLevel: Level
  ttsRate: number
  syncEnabled: boolean
}

export interface AppState {
  version: number
  updatedAt: string
  streak: StreakInfo
  sessions: LessonSession[]
  vocabulary: VocabEntry[]
}

export const EMPTY_APP_STATE: AppState = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  streak: { current: 0, longest: 0, lastCompletedDate: null },
  sessions: [],
  vocabulary: [],
}

export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  githubToken: '',
  githubOwner: '',
  githubRepo: '',
  githubBranch: 'main',
  generationMode: 'auto',
  defaultLevel: 'beginner',
  ttsRate: 0.9,
  syncEnabled: false,
}
