export type Level = 'intro' | 'beginner' | 'intermediate' | 'advanced'

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'intro', label: '입문', hint: '초등 1~3학년 눈높이의 아주 짧고 쉬운 문장 (그림책 수준)' },
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
  | 'animals'
  | 'school'
  | 'custom'

export const BANK_TOPICS: { id: TopicId; label: string }[] = [
  { id: 'daily-life', label: '일상생활' },
  { id: 'travel', label: '여행' },
  { id: 'business', label: '비즈니스/업무' },
  { id: 'current-events', label: '시사/뉴스' },
  { id: 'hobbies', label: '취미/관심사' },
  { id: 'food', label: '음식/요리' },
  { id: 'animals', label: '동물' },
  { id: 'school', label: '학교생활' },
]

/** '입문' 레벨(초1~3학년)에서 보여줄 눈높이 주제만 추린 목록 */
export const INTRO_TOPIC_IDS: TopicId[] = ['daily-life', 'animals', 'school', 'hobbies', 'food', 'travel']

export interface VocabItem {
  term: string
  meaning: string
  example: string
  /** 자연스러운 동의어가 있을 때만 채운다(영어, 한글 뜻 포함 표기: "large (큰)"). */
  synonym?: string
  /** 자연스러운 반대말이 있을 때만 채운다. */
  antonym?: string
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
  /** sentences와 1:1로 대응하는 한국어 해석 (없으면 빈 문자열) */
  translations: string[]
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
  /** 문장 하나씩 연습한 결과인지, 전체 지문을 한 번에 읽은 결과에서 분리해낸 것인지 */
  stage?: 'single' | 'whole'
}

export interface WholePassageReading {
  transcript: string
  durationSec: number
  wpm: number | null
  accuracy: number // 지문 전체 기준 정확도
  sentenceAccuracies: number[] // passage.sentences와 같은 순서의 문장별 정확도
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
  wholePassageReading: WholePassageReading | null
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
  /** Gemini 모델 ID (예: gemini-2.5-flash). 비어있으면 DEFAULT_GEMINI_MODEL을 사용. */
  geminiModel: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
  generationMode: GenerationMode
  defaultLevel: Level
  ttsRate: number
  syncEnabled: boolean
  /** 이 기기에서 마지막으로 선택된 프로필. 기기별 UI 상태라 동기화 대상 AppState가 아닌 로컬 설정에 둔다. */
  activeProfileId: string | null
}

export const PROFILE_EMOJIS = ['🙂', '👦', '👧', '🧑', '👩', '👨', '🐻', '🐰', '🦊', '🐱', '🐶', '⭐'] as const
export const PROFILE_COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#db2777', '#7c3aed'] as const

export interface Profile {
  id: string
  name: string
  emoji: string
  color: string
  level: Level
  ttsRate: number
  createdAt: string
}

export interface ProfileState {
  profileId: string
  updatedAt: string
  streak: StreakInfo
  sessions: LessonSession[]
  vocabulary: VocabEntry[]
}

export function createEmptyProfileState(profileId: string): ProfileState {
  return {
    profileId,
    updatedAt: new Date(0).toISOString(),
    streak: { current: 0, longest: 0, lastCompletedDate: null },
    sessions: [],
    vocabulary: [],
  }
}

export interface AppState {
  version: number
  updatedAt: string
  profiles: Profile[]
  profileStates: Record<string, ProfileState>
}

export const EMPTY_APP_STATE: AppState = {
  version: 2,
  updatedAt: new Date(0).toISOString(),
  profiles: [],
  profileStates: {},
}

export const TTS_SPEED_PRESETS: { rate: number; label: string; emoji: string }[] = [
  { rate: 0.6, label: '느리게', emoji: '🐢' },
  { rate: 0.8, label: '보통', emoji: '🚶' },
  { rate: 1.0, label: '빠르게', emoji: '🐇' },
]

/** 설정 화면에서 바로 고를 수 있는 알려진 모델 프리셋. 목록에 없는 모델도 직접 입력할 수 있다. */
export const GEMINI_MODEL_PRESETS: { id: string; label: string }[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (기본, 무료 티어)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (더 가볍고 빠름)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
]
export const DEFAULT_GEMINI_MODEL = GEMINI_MODEL_PRESETS[0].id

export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  githubToken: '',
  githubOwner: '',
  githubRepo: '',
  githubBranch: 'main',
  generationMode: 'auto',
  defaultLevel: 'beginner',
  ttsRate: 0.8,
  syncEnabled: false,
  activeProfileId: null,
}
