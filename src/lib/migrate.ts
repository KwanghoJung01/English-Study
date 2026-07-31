import type { AppState, LessonSession, StreakInfo, VocabEntry } from '../types'
import { EMPTY_APP_STATE } from '../types'

// 프로필 기능 이전 버전(단일 사용자) 데이터를 마이그레이션할 때 쓰는 고정 ID.
// 랜덤 ID를 쓰면 기기마다 다른 ID가 생겨 GitHub 동기화 시 같은 사용자의 데이터가
// 서로 다른 프로필로 중복 인식되므로, 반드시 고정값을 사용한다.
const LEGACY_PROFILE_ID = 'default-profile'

interface LegacyShape {
  streak?: StreakInfo
  sessions?: LessonSession[]
  vocabulary?: VocabEntry[]
  updatedAt?: string
}

export function migrateAppState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return EMPTY_APP_STATE

  const obj = raw as Partial<AppState> & LegacyShape

  if (Array.isArray(obj.profiles) && obj.profileStates && typeof obj.profileStates === 'object') {
    return obj as AppState
  }

  if (obj.sessions || obj.vocabulary || obj.streak) {
    const updatedAt = obj.updatedAt ?? new Date().toISOString()
    return {
      version: 2,
      updatedAt,
      profiles: [
        {
          id: LEGACY_PROFILE_ID,
          name: '나',
          emoji: '🙂',
          color: '#4f46e5',
          level: 'beginner',
          ttsRate: 0.9,
          createdAt: updatedAt,
        },
      ],
      profileStates: {
        [LEGACY_PROFILE_ID]: {
          profileId: LEGACY_PROFILE_ID,
          updatedAt,
          streak: obj.streak ?? { current: 0, longest: 0, lastCompletedDate: null },
          sessions: obj.sessions ?? [],
          vocabulary: obj.vocabulary ?? [],
        },
      },
    }
  }

  return EMPTY_APP_STATE
}
