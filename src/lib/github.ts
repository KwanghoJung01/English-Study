import type { AppState, Settings } from '../types'
import { migrateAppState } from './migrate'

const PROGRESS_PATH = 'progress/state.json'

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function apiBase(settings: Settings): string {
  return `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${PROGRESS_PATH}`
}

function authHeaders(settings: Settings): HeadersInit {
  return {
    Authorization: `Bearer ${settings.githubToken}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

export function isGithubConfigured(settings: Settings): boolean {
  return Boolean(settings.githubToken && settings.githubOwner && settings.githubRepo)
}

export interface RemoteStateResult {
  state: AppState | null
  sha: string | null
}

export async function fetchRemoteState(settings: Settings): Promise<RemoteStateResult> {
  const url = `${apiBase(settings)}?ref=${encodeURIComponent(settings.githubBranch)}`
  const res = await fetch(url, { headers: authHeaders(settings) })

  if (res.status === 404) {
    return { state: null, sha: null }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub에서 진행 기록을 불러오지 못했습니다 (${res.status}): ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  const content = base64ToUtf8(json.content as string)
  return { state: migrateAppState(JSON.parse(content)), sha: json.sha as string }
}

export async function pushRemoteState(
  settings: Settings,
  state: AppState,
  sha: string | null,
): Promise<string> {
  const body = {
    message: `chore: update progress (${state.updatedAt})`,
    content: utf8ToBase64(JSON.stringify(state, null, 2)),
    branch: settings.githubBranch,
    sha: sha ?? undefined,
  }
  const res = await fetch(apiBase(settings), {
    method: 'PUT',
    headers: authHeaders(settings),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub에 진행 기록을 저장하지 못했습니다 (${res.status}): ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.content?.sha as string
}

/**
 * 로컬/원격 상태를 프로필 단위로 병합한다. 가족 구성원이 서로 다른 기기에서 각자의
 * 프로필로 학습할 수 있으므로, 전체를 통째로 비교해 덮어쓰면 한쪽 기기에서만 최신인
 * 프로필의 데이터가 다른 프로필의 예전 데이터에 밀려 사라질 수 있다. 따라서 프로필
 * 목록은 합집합으로 두고, 각 프로필의 학습 기록은 그 프로필 자체의 updatedAt이 더
 * 최근인 쪽을 채택한다.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const remoteIsNewer = new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime()

  const profileMap = new Map(local.profiles.map((p) => [p.id, p]))
  for (const remoteProfile of remote.profiles) {
    const localProfile = profileMap.get(remoteProfile.id)
    if (!localProfile || remoteIsNewer) {
      profileMap.set(remoteProfile.id, remoteProfile)
    }
  }

  const profileIds = new Set([...Object.keys(local.profileStates), ...Object.keys(remote.profileStates)])
  const profileStates: AppState['profileStates'] = {}
  for (const id of profileIds) {
    const l = local.profileStates[id]
    const r = remote.profileStates[id]
    if (!l) profileStates[id] = r
    else if (!r) profileStates[id] = l
    else profileStates[id] = new Date(r.updatedAt).getTime() > new Date(l.updatedAt).getTime() ? r : l
  }

  return {
    version: 2,
    updatedAt: remoteIsNewer ? remote.updatedAt : local.updatedAt,
    profiles: [...profileMap.values()],
    profileStates,
  }
}
