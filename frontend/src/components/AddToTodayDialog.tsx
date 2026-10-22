import { useRef } from 'react';
import { Plus } from 'lucide-react';
import Modal from './Modal';
import UrgencyBadge from './UrgencyBadge';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import { activityProgress, splitCompleted } from '../lib/progress';
import type { CategoryBoard } from '../lib/types';

interface Props {
  board: CategoryBoard[];
  onAdd: (id: number) => void;
  onClose: () => void;
}

/** Picker of unfinished sub-categories not yet on Today, grouped by category. Stays open for several picks. */
export default function AddToTodayDialog({ board, onAdd, onClose }: Props) {
  const doneRef = useRef<HTMLButtonElement>(null);
  const groups = board
    .map((c) => ({ category: c, subs: splitCompleted(c.subcategories).active.filter((s) => !s.today) }))
    .filter((g) => g.subs.length > 0);

  return (
    <Modal labelledBy="add-today-title" onClose={onClose} initialFocus={doneRef}>
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
          <h2 id="add-today-title" className="text-lg font-semibold">
            Add to Today
          </h2>
          <button
            ref={doneRef}
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Done
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4">
          {groups.length === 0 && <p className="text-sm text-slate-500">Everything unfinished is already on Today.</p>}
          {groups.map(({ category, subs }) => (
            <section key={category.key} aria-labelledby={`add-today-${category.key}`}>
              <h3
                id={`add-today-${category.key}`}
                className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-600"
              >
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[category.key].dot}`} />
                {category.label}
              </h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {subs.map((s) => {
                  const progress = activityProgress(s.activities);
                  return (
                    <li key={s.id} className="flex items-center gap-2 px-3 py-2">
                      <UrgencyBadge urgency={s.urgency} name={s.name} />
                      <span className="min-w-0 flex-1 break-words text-sm">{s.name}</span>
                      <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                        {progress.done}/{progress.total}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdd(s.id)}
                        aria-label={`Add ${s.name} to Today`}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Plus size={14} aria-hidden="true" />
                        Add
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
