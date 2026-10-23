import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, EyeOff } from 'lucide-react';

export type CompletedView = 'open' | 'minimised' | 'hidden';
export const COMPLETED_VIEWS: readonly CompletedView[] = ['open', 'minimised', 'hidden'];

interface Props {
  count: number;
  view: CompletedView;
  onViewChange: (view: CompletedView) => void;
  children: ReactNode;
}

/** Bottom section for finished sub-categories. Can be minimised to its header or hidden entirely. */
export default function CompletedSection({ count, view, onViewChange, children }: Props) {
  if (count === 0) return null;

  if (view === 'hidden') {
    return (
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onViewChange('open')}
          className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Show completed ({count})
        </button>
      </div>
    );
  }

  const open = view === 'open';
  return (
    <section aria-labelledby="completed-heading" className="rounded-lg border border-slate-200 bg-white/50 p-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onViewChange(open ? 'minimised' : 'open')}
          aria-expanded={open}
          aria-controls="completed-list"
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
        >
          <span className="p-1 text-slate-400">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
          <h2 id="completed-heading" className="text-base font-semibold text-slate-600">
            Completed
          </h2>
          <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
            {count}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onViewChange('hidden')}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <EyeOff size={14} aria-hidden="true" />
          Hide
        </button>
      </div>
      {open && (
        <div id="completed-list" className="mt-3 space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}
