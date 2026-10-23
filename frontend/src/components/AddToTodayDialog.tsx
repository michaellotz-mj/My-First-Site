import { useRef } from 'react';
import { Check, Plus } from 'lucide-react';
import AddForm from './AddForm';
import Modal from './Modal';
import UrgencyBadge from './UrgencyBadge';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import { activityProgress, splitCompleted } from '../lib/progress';
import type { CategoryBoard, CategoryKey } from '../lib/types';

interface Props {
  board: CategoryBoard[];
  onAdd: (id: number) => void;
  /** Creates a new sub-category in that category, already on Today. */
  onCreate: (category: CategoryKey, name: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Picker for Today: every category, its unfinished sub-categories (ones already on Today are marked),
 * and a box to create a new one straight onto Today. Stays open for several picks.
 */
export default function AddToTodayDialog({ board, onAdd, onCreate, onClose }: Props) {
  const doneRef = useRef<HTMLButtonElement>(null);
  const groups = board.map((c) => ({ category: c, subs: splitCompleted(c.subcategories).active }));

  return (
    <Modal labelledBy="add-today-title" onClose={onClose} initialFocus={doneRef}>
      <div className="flex max-h-[85vh] flex-col">
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
        <div className="space-y-5 overflow-y-auto p-4">
          {groups.map(({ category, subs }) => (
            <section key={category.key} aria-labelledby={`add-today-${category.key}`} className="space-y-2">
              <h3
                id={`add-today-${category.key}`}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600"
              >
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[category.key].dot}`} />
                {category.label}
              </h3>
              {subs.length === 0 ? (
                <p className="text-sm text-slate-500">No unfinished {category.label} sub-categories yet.</p>
              ) : (
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
                        {s.today ? (
                          <span className="flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700">
                            <Check size={14} aria-hidden="true" />
                            On Today
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAdd(s.id)}
                            aria-label={`Add ${s.name} to Today`}
                            className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Plus size={14} aria-hidden="true" />
                            Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <AddForm
                placeholder={`New ${category.label} sub-category`}
                onAdd={(name) => onCreate(category.key, name)}
              />
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
