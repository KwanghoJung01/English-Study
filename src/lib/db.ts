import { openDB, type IDBPDatabase } from 'idb'
import type { AppState } from '../types'
import { EMPTY_APP_STATE } from '../types'

const DB_NAME = 'english-study-db'
const DB_VERSION = 1
const STORE = 'app-state'
const STATE_KEY = 'state'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      },
    })
  }
  return dbPromise
}

export async function loadLocalState(): Promise<AppState> {
  try {
    const db = await getDb()
    const state = await db.get(STORE, STATE_KEY)
    return state ?? EMPTY_APP_STATE
  } catch {
    return EMPTY_APP_STATE
  }
}

export async function saveLocalState(state: AppState): Promise<void> {
  const db = await getDb()
  await db.put(STORE, state, STATE_KEY)
}
