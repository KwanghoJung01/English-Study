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
import type { AppState, LessonSession, Level, Settings, VocabEntry, VocabItem } from '../types'
import { EMPTY_APP_STATE } from '../types'
import { loadLocalState, saveLocalState } from './db'
import { loadSettings, saveSettings } from './settings'
import { fetchRemoteState, isGithubConfigured, mergeStates, pushRemoteState } from './github'
import { applyCompletion, todayKey } from './streak'
import { reviewVocab as reviewVocabEntry } from './srs'
import { generateId } from './id'

type SyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error'

interface AppStore {
  state: AppState
  settings: Settings
  ready: boolean
  syncStatus: SyncStatus
  syncError: string | null
  updateSettings: (patch: Partial<Settings>) => void
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

  const addSession = useCallback(
    (session: Omit<LessonSession, 'id' | 'completedAt'>) => {
      commitState((prev) => {
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
    [commitState],
  )

  const addVocabEntries = useCallback(
    (items: VocabItem[], level: Level) => {
      commitState((prev) => {
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
    [commitState],
  )

  const reviewVocab = useCallback(
    (id: string, correct: boolean) => {
      commitState((prev) => ({
        ...prev,
        vocabulary: prev.vocabulary.map((v) => (v.id === id ? reviewVocabEntry(v, correct) : v)),
      }))
    },
    [commitState],
  )

  const syncNow = useCallback(async () => {
    await pushToGithub(state)
  }, [pushToGithub, state])

  const value = useMemo<AppStore>(
    () => ({
      state,
      settings,
      ready,
      syncStatus,
      syncError,
      updateSettings,
      addSession,
      addVocabEntries,
      reviewVocab,
      syncNow,
    }),
    [state, settings, ready, syncStatus, syncError, updateSettings, addSession, addVocabEntries, reviewVocab, syncNow],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
