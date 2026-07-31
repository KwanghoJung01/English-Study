import { useState, type ReactNode } from 'react'
import { useAppStore } from '../lib/store'
import { Button, Card } from '../components/ui'
import { LEVELS, type GenerationMode, type Level } from '../types'

const MODE_LABEL: Record<GenerationMode, string> = {
  auto: '자동 (Gemini 우선, 실패 시 콘텐츠 뱅크)',
  gemini: 'Gemini만 사용',
  bank: '콘텐츠 뱅크만 사용',
}

export default function Settings() {
  const { settings, updateSettings, syncNow, syncStatus, syncError } = useAppStore()
  const [showToken, setShowToken] = useState(false)
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-4">
      <Section title="지문 생성 방식">
        <div className="flex flex-col gap-1.5">
          {(Object.keys(MODE_LABEL) as GenerationMode[]).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="generationMode"
                checked={settings.generationMode === mode}
                onChange={() => updateSettings({ generationMode: mode })}
              />
              {MODE_LABEL[mode]}
            </label>
          ))}
        </div>

        <label className="mt-3 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Gemini API 키 (무료, aistudio.google.com에서 발급)
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={settings.geminiApiKey}
            onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
            placeholder="AIza..."
            className="flex-1 rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
          />
          <Button variant="secondary" onClick={() => setShowKey((s) => !s)}>
            {showKey ? '숨기기' : '보기'}
          </Button>
        </div>
      </Section>

      <Section title="기본 학습 설정">
        <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">기본 수준</label>
        <select
          value={settings.defaultLevel}
          onChange={(e) => updateSettings({ defaultLevel: e.target.value as Level })}
          className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        <label className="mb-1 mt-3 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          원어민 듣기 속도: {settings.ttsRate.toFixed(1)}x
        </label>
        <input
          type="range"
          min={0.5}
          max={1.3}
          step={0.1}
          value={settings.ttsRate}
          onChange={(e) => updateSettings({ ttsRate: Number(e.target.value) })}
          className="w-full"
        />
      </Section>

      <Section title="GitHub 진행 기록 동기화">
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          이 저장소(Contents 읽기/쓰기 권한)로 범위를 제한한 Fine-grained Personal Access Token을 사용하세요. 토큰은
          이 기기의 브라우저에만 저장되며 어디에도 전송되지 않습니다(GitHub API 호출 제외).
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.syncEnabled}
            onChange={(e) => updateSettings({ syncEnabled: e.target.checked })}
          />
          GitHub 자동 동기화 사용
        </label>

        <div className="mt-3 flex flex-col gap-2">
          <Field label="GitHub 저장소 소유자 (예: kwanghojung01)">
            <input
              value={settings.githubOwner}
              onChange={(e) => updateSettings({ githubOwner: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
            />
          </Field>
          <Field label="저장소 이름 (예: English-Study)">
            <input
              value={settings.githubRepo}
              onChange={(e) => updateSettings({ githubRepo: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
            />
          </Field>
          <Field label="브랜치">
            <input
              value={settings.githubBranch}
              onChange={(e) => updateSettings({ githubBranch: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
            />
          </Field>
          <Field label="Personal Access Token">
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.githubToken}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
                placeholder="github_pat_..."
                className="flex-1 rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
              />
              <Button variant="secondary" onClick={() => setShowToken((s) => !s)}>
                {showToken ? '숨기기' : '보기'}
              </Button>
            </div>
          </Field>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            상태: {syncStatus === 'synced' ? '동기화됨' : syncStatus === 'syncing' ? '동기화 중…' : syncStatus === 'error' ? '오류' : '대기'}
          </span>
          <Button variant="secondary" onClick={() => void syncNow()}>
            지금 동기화
          </Button>
        </div>
        {syncError && <p className="mt-2 text-xs text-rose-500">{syncError}</p>}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      {children}
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  )
}
