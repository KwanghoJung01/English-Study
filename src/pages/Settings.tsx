import { useState, type ReactNode } from 'react'
import { useAppStore, type NewProfileInput } from '../lib/store'
import { Button, Card } from '../components/ui'
import {
  LEVELS,
  PROFILE_COLORS,
  PROFILE_EMOJIS,
  type GenerationMode,
  type Level,
  type Profile,
} from '../types'

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
      <ProfileManager />

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

function ProfileManager() {
  const { profiles, activeProfile, createProfile, updateProfile, deleteProfile, setActiveProfile } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <Section title="가족 프로필">
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        가족 구성원마다 프로필을 만들면 각자의 수준·주제로 따로 학습하고, "가족 비교" 탭에서 기록을 비교할 수 있어요.
      </p>

      {profiles.length === 0 && (
        <p className="mb-3 text-sm text-slate-400">아직 프로필이 없어요. 아래에서 첫 프로필을 만들어주세요.</p>
      )}

      <div className="flex flex-col gap-2">
        {profiles.map((p) =>
          editingId === p.id ? (
            <Card key={p.id} className="bg-slate-50 dark:bg-slate-800">
              <ProfileForm
                initial={p}
                submitLabel="저장"
                onCancel={() => setEditingId(null)}
                onSubmit={(input) => {
                  updateProfile(p.id, input)
                  setEditingId(null)
                }}
              />
            </Card>
          ) : (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <button type="button" onClick={() => setActiveProfile(p.id)} className="flex items-center gap-2 text-left">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ background: `${p.color}22` }}
                >
                  {p.emoji}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-[11px] text-slate-400">
                    {LEVELS.find((l) => l.id === p.level)?.label}
                    {activeProfile?.id === p.id && ' · 선택됨'}
                  </span>
                </span>
              </button>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setEditingId(p.id)}>
                  수정
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-500"
                  onClick={() => {
                    if (window.confirm(`"${p.name}" 프로필과 학습 기록을 삭제할까요? 되돌릴 수 없어요.`)) {
                      deleteProfile(p.id)
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>
          ),
        )}
      </div>

      {showAddForm ? (
        <Card className="mt-3 bg-slate-50 dark:bg-slate-800">
          <ProfileForm
            submitLabel="추가"
            onCancel={() => setShowAddForm(false)}
            onSubmit={(input) => {
              createProfile(input)
              setShowAddForm(false)
            }}
          />
        </Card>
      ) : (
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setShowAddForm(true)}>
          + 새 프로필 추가
        </Button>
      )}
    </Section>
  )
}

function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Profile
  submitLabel: string
  onSubmit: (input: NewProfileInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? PROFILE_EMOJIS[0])
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLORS[0])
  const [level, setLevel] = useState<Level>(initial?.level ?? 'beginner')

  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 / 별명 (예: 민준이)"
        className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
      />
      <div className="flex flex-wrap gap-2">
        {PROFILE_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base ${
              emoji === e ? 'border-indigo-500' : 'border-transparent bg-slate-100 dark:bg-slate-700'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {PROFILE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value as Level)}
        className="w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800"
      >
        {LEVELS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label} — {l.hint}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button className="flex-1" disabled={!name.trim()} onClick={() => onSubmit({ name, emoji, color, level })}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
