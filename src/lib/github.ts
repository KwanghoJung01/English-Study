import type { AppState, Settings } from '../types'

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
  return { state: JSON.parse(content) as AppState, sha: json.sha as string }
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

/** 더 최근에 갱신된 쪽을 기준으로 로컬/원격 상태를 병합한다. */
export function mergeStates(local: AppState, remote: AppState): AppState {
  if (new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
    return remote
  }
  return local
}
