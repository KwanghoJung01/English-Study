export default function TranslationToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        show
          ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
          : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
      }`}
    >
      {show ? '🇰🇷 해석 숨기기' : '🇰🇷 해석 보기'}
    </button>
  )
}
