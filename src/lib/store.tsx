import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  LessonSession,
  Level,
  Profile,
  ProfileState,
  Settings,
  VocabEntry,
  VocabItem,
} from '../types'
import { EMPTY_APP_STATE, createEmptyProfileState } from '../types'
import { loadLocalState, saveLocalState } from './db'
import { loadSettings, saveSettings } from './settings'
import { fetchRemoteState, isGithubConfigured, mergeStates, pushRemoteState } from './github'
import { applyCompletion, todayKey } from './streak'
import { reviewVocab as reviewVocabEntry } from './srs'
import { generateId } from './id'

type SyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error'

export interface NewProfileInput {
  name: string
  emoji: string
  color: string
  level: Level
}

interface AppStore {
  state: AppState
  settings: Settings
  ready: boolean
  syncStatus: SyncStatus
  syncError: string | null
  profiles: Profile[]
  activeProfile: Profile | null
  activeProfileState: ProfileState | null
  updateSettings: (patch: Partial<Settings>) => void
  createProfile: (input: NewProfileInput) => string
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string) => void
  addSession: (session: Omit<LessonSession, 'id' | 'completedAt'>) => void
  addVocabEntries: (items: VocabItem[], level: Level) => void
  reviewVocab: (id: string, correct: boolean) => void
  syncNow: () => Promise<void>
}

const AppStoreContext = createContext<AppStore | null>(null)

function touch(state: AppState): AppState {
  return { ...state, updatedAt: new Date().toISOString() }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_APP_STATE)
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [ready, setReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  const shaRef = useRef<string | null>(null)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const pushToGithub = useCallback(async (nextState: AppState) => {
    if (!isGithubConfigured(settingsRef.current) || !settingsRef.current.syncEnabled) return
    setSyncStatus('syncing')
    setSyncError(null)
    try {
      const sha = await pushRemoteState(settingsRef.current, nextState, shaRef.current)
      shaRef.current = sha
      setSyncStatus('synced')
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  const schedulePush = useCallback(
    (nextState: AppState) => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      pushTimerRef.current = setTimeout(() => {
        void pushToGithub(nextState)
      }, 2500)
    },
    [pushToGithub],
  )

  const commitState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = touch(updater(prev))
        void saveLocalState(next)
        schedulePush(next)
        return next
      })
    },
    [schedulePush],
  )

  const commitProfileState = useCallback(
    (profileId: string, updater: (prev: ProfileState) => ProfileState) => {
      commitState((prev) => {
        const prevProfileState = prev.profileStates[profileId] ?? createEmptyProfileState(profileId)
        const nextProfileState: ProfileState = {
          ...updater(prevProfileState),
          profileId,
          updatedAt: new Date().toISOString(),
        }
        return {
          ...prev,
          profileStates: { ...prev.profileStates, [profileId]: nextProfileState },
        }
      })
    },
    [commitState],
  )

  // 초기 로드: 로컬(IndexedDB) 상태를 먼저 표시하고, GitHub 연동 시 원격 상태와 병합
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSyncStatus('loading')
      const local = await loadLocalState()
      if (cancelled) return
      setState(local)
      setReady(true)

      if (isGithubConfigured(settingsRef.current)) {
        try {
          const remote = await fetchRemoteState(settingsRef.current)
          if (cancelled) return
          shaRef.current = remote.sha
          if (remote.state) {
            const merged = mergeStates(local, remote.state)
            setState(merged)
            void saveLocalState(merged)
          }
          setSyncStatus('synced')
        } catch (err) {
          if (!cancelled) {
            setSyncStatus('error')
            setSyncError(err instanceof Error ? err.message : String(err))
          }
        }
      } else {
        setSyncStatus('idle')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const createProfile = useCallback(
    (input: NewProfileInput): string => {
      const id = generateId()
      const profile: Profile = {
        id,
        name: input.name.trim() || '이름 없음',
        emoji: input.emoji,
        color: input.color,
        level: input.level,
        ttsRate: 0.9,
        createdAt: new Date().toISOString(),
      }
      commitState((prev) => ({
        ...prev,
        profiles: [...prev.profiles, profile],
        profileStates: { ...prev.profileStates, [id]: createEmptyProfileState(id) },
      }))
      updateSettings({ activeProfileId: id })
      return id
    },
    [commitState, updateSettings],
  )

  const updateProfile = useCallback(
    (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => {
      commitState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }))
    },
    [commitState],
  )

  const deleteProfile = useCallback(
    (id: string) => {
      commitState((prev) => {
        const profileStates = { ...prev.profileStates }
        delete profileStates[id]
        return {
          ...prev,
          profiles: prev.profiles.filter((p) => p.id !== id),
          profileStates,
        }
      })
      if (settingsRef.current.activeProfileId === id) {
        const remaining = state.profiles.filter((p) => p.id !== id)
        updateSettings({ activeProfileId: remaining[0]?.id ?? null })
      }
    },
    [commitState, updateSettings, state.profiles],
  )

  const setActiveProfile = useCallback(
    (id: string) => {
      updateSettings({ activeProfileId: id })
    },
    [updateSettings],
  )

  const addSession = useCallback(
    (session: Omit<LessonSession, 'id' | 'completedAt'>) => {
      const profileId = settingsRef.current.activeProfileId
      if (!profileId) return
      commitProfileState(profileId, (prev) => {
        const full: LessonSession = {
          ...session,
          id: generateId(),
          completedAt: new Date().toISOString(),
        }
        const streak = session.isReview ? prev.streak : applyCompletion(prev.streak, session.date)
        return {
          ...prev,
          sessions: [full, ...prev.sessions].slice(0, 500),
          streak,
        }
      })
    },
    [commitProfileState],
  )

  const addVocabEntries = useCallback(
    (items: VocabItem[], level: Level) => {
      const profileId = settingsRef.current.activeProfileId
      if (!profileId) return
      commitProfileState(profileId, (prev) => {
        const existingTerms = new Set(prev.vocabulary.map((v) => v.term.toLowerCase()))
        const today = todayKey()
        const newEntries: VocabEntry[] = items
          .filter((item) => !existingTerms.has(item.term.toLowerCase()))
          .map((item) => ({
            ...item,
            id: generateId(),
            level,
            addedDate: today,
            srsBox: 0,
            nextReviewDate: today,
            lastResult: null,
            reviewCount: 0,
          }))
        if (newEntries.length === 0) return prev
        return { ...prev, vocabulary: [...newEntries, ...prev.vocabulary] }
      })
    },
    [commitProfileState],
  )

  const reviewVocab = useCallback(
    (id: string, correct: boolean) => {
      const profileId = settingsRef.current.activeProfileId
      if (!profileId) return
      commitProfileState(profileId, (prev) => ({
        ...prev,
        vocabulary: prev.vocabulary.map((v) => (v.id === id ? reviewVocabEntry(v, correct) : v)),
      }))
    },
    [commitProfileState],
  )

  const syncNow = useCallback(async () => {
    await pushToGithub(state)
  }, [pushToGithub, state])

  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === settings.activeProfileId) ?? null,
    [state.profiles, settings.activeProfileId],
  )
  const activeProfileState = useMemo(
    () => (activeProfile ? (state.profileStates[activeProfile.id] ?? createEmptyProfileState(activeProfile.id)) : null),
    [state.profileStates, activeProfile],
  )

  const value = useMemo<AppStore>(
    () => ({
      state,
      settings,
      ready,
      syncStatus,
      syncError,
      profiles: state.profiles,
      activeProfile,
      activeProfileState,
      updateSettings,
      createProfile,
      updateProfile,
      deleteProfile,
      setActiveProfile,
      addSession,
      addVocabEntries,
      reviewVocab,
      syncNow,
    }),
    [
      state,
      settings,
      ready,
      syncStatus,
      syncError,
      activeProfile,
      activeProfileState,
      updateSettings,
      createProfile,
      updateProfile,
      deleteProfile,
      setActiveProfile,
      addSession,
      addVocabEntries,
      reviewVocab,
      syncNow,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
