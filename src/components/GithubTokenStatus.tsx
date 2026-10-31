import { useEffect, useState } from 'react'
import { Button } from './ui'
import { useAppStore } from '../lib/store'
import { checkGithubToken, isGithubConfigured, type TokenCheckResult } from '../lib/github'

const TOKENS_URL = 'https://github.com/settings/personal-access-tokens'

function daysUntil(dateStr: string): number | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function expiryLabel(days: number | null): { text: string; tone: string } {
  if (days === null) return { text: '만료일을 입력해두면 남은 기간을 알려드려요.', tone: 'text-slate-400' }
  if (days < 0) return { text: '만료됨 · 새 토큰을 발급해야 동기화돼요.', tone: 'text-rose-500 font-semibold' }
  if (days === 0) return { text: '오늘 만료돼요 · 지금 새 토큰을 발급해주세요.', tone: 'text-rose-500 font-semibold' }
  if (days <= 30) return { text: `D-${days} · 곧 만료돼요. 미리 다시 발급해주세요.`, tone: 'text-amber-600 font-semibold dark:text-amber-400' }
  return { text: `D-${days}`, tone: 'text-emerald-600 dark:text-emerald-400' }
}

type CheckState = { kind: 'idle' } | { kind: 'checking' } | { kind: 'done'; result: TokenCheckResult } | { kind: 'failed' }

function checkMessage(state: CheckState): { text: string; tone: string } | null {
  if (state.kind === 'checking') return { text: '토큰 확인 중…', tone: 'text-slate-400' }
  if (state.kind === 'failed') return { text: '토큰을 확인하지 못했어요. 인터넷 연결을 확인해주세요.', tone: 'text-slate-400' }
  if (state.kind !== 'done') return null
  const { ok, status, expiry } = state.result
  if (ok) return { text: expiry ? '토큰 정상 ✓ (만료일을 GitHub에서 자동으로 확인했어요)' : '토큰 정상 ✓', tone: 'text-emerald-600 dark:text-emerald-400' }
  if (status === 401) return { text: '토큰이 만료됐거나 잘못됐어요 (401). ! 버튼을 눌러 다시 발급하는 방법을 확인하세요.', tone: 'text-rose-500' }
  if (status === 403) return { text: '토큰에 이 저장소 접근 권한이 없어요 (403).', tone: 'text-rose-500' }
  if (status === 404) return { text: '저장소를 찾을 수 없어요 (404). 소유자·저장소 이름을 확인하세요.', tone: 'text-rose-500' }
  return { text: `토큰 확인 실패 (${status})`, tone: 'text-rose-500' }
}

export default function GithubTokenStatus() {
  const { settings, updateSettings } = useAppStore()
  const [showGuide, setShowGuide] = useState(false)
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' })

  const days = daysUntil(settings.githubTokenExpiry)
  const label = expiryLabel(days)
  const urgent = days !== null && days <= 30
  const message = checkMessage(check)

  async function runCheck() {
    if (!isGithubConfigured(settings)) return
    setCheck({ kind: 'checking' })
    try {
      const result = await checkGithubToken(settings)
      setCheck({ kind: 'done', result })
      if (result.ok && result.expiry && result.expiry !== settings.githubTokenExpiry) {
        updateSettings({ githubTokenExpiry: result.expiry })
      }
    } catch {
      setCheck({ kind: 'failed' })
    }
  }

  // 화면을 열 때와 토큰·저장소 정보를 바꿨을 때(입력이 멈춘 뒤) 토큰 상태를 확인한다.
  useEffect(() => {
    if (!isGithubConfigured(settings)) {
      setCheck({ kind: 'idle' })
      return
    }
    const timer = setTimeout(() => void runCheck(), 800)
    return () => clearTimeout(timer)
    // 입력값이 바뀔 때만 다시 확인한다(runCheck는 매 렌더 새로 만들어짐).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.githubToken, settings.githubOwner, settings.githubRepo])

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <label htmlFor="token-expiry" className="text-xs text-slate-400">
          토큰 만료일
        </label>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          aria-label="토큰 다시 발급하는 방법 보기"
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
            urgent ? 'bg-rose-500' : 'bg-indigo-500'
          }`}
        >
          !
        </button>
      </div>
      <input
        id="token-expiry"
        type="date"
        value={settings.githubTokenExpiry}
        onChange={(e) => updateSettings({ githubTokenExpiry: e.target.value })}
        className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
      />
      <p className={`mt-1 text-xs ${label.tone}`}>{label.text}</p>

      <div className="mt-2 flex items-start justify-between gap-2">
        <p className={`text-xs ${message?.tone ?? ''}`}>{message?.text ?? ''}</p>
        <Button
          variant="secondary"
          className="shrink-0 whitespace-nowrap"
          disabled={check.kind === 'checking' || !isGithubConfigured(settings)}
          onClick={() => void runCheck()}
        >
          토큰 확인
        </Button>
      </div>

      {showGuide && <TokenGuideModal repo={settings.githubRepo} onClose={() => setShowGuide(false)} />}
    </div>
  )
}

function TokenGuideModal({ repo, onClose }: { repo: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-guide-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-sm text-slate-700 shadow-xl dark:bg-slate-900 dark:text-slate-200"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="token-guide-title" className="text-base font-bold">
            GitHub 토큰 다시 발급하기
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="px-2 text-lg text-slate-400">
            ✕
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          토큰이 만료됐거나 동기화에서 401 오류가 나면 아래 순서대로 새 토큰을 발급해 이 앱에 넣어주세요. GitHub 앱이 아닌
          <b> 폰 브라우저(Chrome)</b>에서 해야 해요.
        </p>

        <a
          href={TOKENS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block rounded-xl bg-indigo-600 p-3 text-center font-semibold text-white"
        >
          GitHub 토큰 화면 열기 ↗
        </a>
        <a
          href={TOKENS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="-mt-3 mb-4 block break-all text-center text-xs text-indigo-500 underline"
        >
          github.com/settings/personal-access-tokens
        </a>

        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>
            목록에서 이 앱용 토큰 이름(예: <b>english-study</b>)을 누르세요.
          </li>
          <li>
            <b>Regenerate token</b>을 누르세요. 저장소와 권한 설정은 그대로 유지돼요.
          </li>
          <li>
            <b>Expiration</b>은 <b>Custom</b>을 골라 1년 뒤쯤으로 넉넉하게 정하세요.
          </li>
          <li>
            <b>Regenerate token</b>을 한 번 더 눌러 확정한 뒤, 나온 <code>github_pat_…</code> 토큰을 <b>바로 복사</b>하세요. 화면을
            벗어나면 다시 볼 수 없어요.
          </li>
          <li>
            이 앱 <b>설정 → Personal Access Token</b> 칸에 붙여넣고, <b>토큰 만료일</b>을 새 날짜로 바꾼 뒤 <b>지금 동기화</b>를
            누르세요.
          </li>
          <li>
            <b>가족 폰 모두</b> 같은 새 토큰으로 바꿔주세요. 다시 발급하면 그 전 토큰은 바로 사용할 수 없게 돼요.
          </li>
        </ol>

        <details className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
          <summary className="cursor-pointer font-semibold">토큰이 목록에 없을 때 (처음 새로 만들기)</summary>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
            <li>
              같은 화면에서 <b>Generate new token</b>을 누르세요.
            </li>
            <li>Token name을 정하고, Expiration은 Custom으로 1년 뒤쯤 정하세요.</li>
            <li>
              Repository access는 <b>Only select repositories</b>를 골라 <b>{repo || '진행 기록 저장소'}</b>만 선택하세요.
            </li>
            <li>
              Permissions → Repository permissions → <b>Contents</b>를 <b>Read and write</b>로 바꾸세요.
            </li>
            <li>
              맨 아래 <b>Generate token</b>을 누르고, 나온 토큰을 복사해 이 앱에 붙여넣으세요.
            </li>
          </ol>
        </details>

        <Button className="mt-4 w-full" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  )
}
