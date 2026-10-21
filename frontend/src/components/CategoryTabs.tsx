import { useRef, type KeyboardEvent } from 'react';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import { subcategoryProgress, type Tab } from '../lib/progress';
import type { CategoryBoard } from '../lib/types';

interface Props {
  board: CategoryBoard[];
  tab: Tab;
  onChange: (tab: Tab) => void;
}

/** "All" plus one tab per category, each with its done/total sub-category count. */
export default function CategoryTabs({ board, tab, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs: { key: Tab; label: string; dot: string; done: number; total: number }[] = [
    {
      key: 'all',
      label: 'All',
      dot: 'bg-brand',
      ...subcategoryProgress(board.flatMap((c) => c.subcategories)),
    },
    ...board.map((c) => ({
      key: c.key,
      label: c.label,
      dot: CATEGORY_STYLES[c.key].dot,
      ...subcategoryProgress(c.subcategories),
    })),
  ];

  /** Left/Right/Home/End move between tabs, as screen-reader users expect. */
  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="mb-5 grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-white/60 p-1"
    >
      {tabs.map((t, i) => {
        const selected = t.key === tab;
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={selected}
            aria-controls="tab-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex min-w-0 flex-col items-center justify-center rounded-md px-1 py-1.5 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand sm:flex-row sm:gap-1.5 sm:px-3 ${
              selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/70'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
              {t.label}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {t.done}/{t.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
