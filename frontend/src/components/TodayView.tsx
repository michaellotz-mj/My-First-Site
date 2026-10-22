import { useState } from 'react';
import { ListPlus, Sun } from 'lucide-react';
import AddForm from './AddForm';
import AddToTodayDialog from './AddToTodayDialog';
import { SortableItem, SortableList } from './Sortable';
import SubcategoryCard, { type CardActions } from './SubcategoryCard';
import { activityProgress, type PlacedSubcategory } from '../lib/progress';
import type { CategoryBoard, CategoryKey } from '../lib/types';

interface Props {
  board: CategoryBoard[];
  /** Today items in Today order (finished ones included). */
  items: PlacedSubcategory[];
  actions: CardActions;
  onReorder: (activeId: number, overId: number) => void;
  onCreate: (category: CategoryKey, name: string) => Promise<void>;
  onClearFinished: (ids: number[]) => void;
}

const dateLabel = () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

/** The Today list: picked sub-categories from any category, plus quick add. Finished ones show in Completed. */
export default function TodayView({ board, items, actions, onReorder, onCreate, onClearFinished }: Props) {
  const [picking, setPicking] = useState(false);
  const [category, setCategory] = useState<CategoryKey>('work');
  const active = items.filter((i) => !activityProgress(i.sub.activities).complete);
  const finished = items.filter((i) => activityProgress(i.sub.activities).complete);

  return (
    <section aria-labelledby="today-heading" className="space-y-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/70 pb-1.5">
        <h2 id="today-heading" className="flex items-baseline gap-2 text-lg font-semibold">
          <Sun size={16} aria-hidden="true" className="self-center text-amber-500" />
          Today
          <span className="text-sm font-normal text-slate-500">{dateLabel()}</span>
        </h2>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ListPlus size={16} aria-hidden="true" />
          Add from your lists
        </button>
      </div>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-600">
          Nothing on Today yet. Use <strong>Add from your lists</strong>, tap the sun on any sub-category, or add a new
          task below.
        </p>
      )}
      {items.length > 0 && active.length === 0 && (
        <p className="text-sm text-slate-500">Everything on Today is done.</p>
      )}

      <SortableList
        ids={active.map((i) => i.sub.id)}
        nameOf={(id) => active.find((i) => i.sub.id === id)?.sub.name ?? 'sub-category'}
        onReorder={onReorder}
      >
        <div className="space-y-3">
          {active.map(({ sub, category: c }) => (
            <SortableItem key={sub.id} id={sub.id} handleLabel={`Reorder ${sub.name}`} disabled={active.length < 2}>
              {(handle, dragging) => (
                <SubcategoryCard
                  sub={sub}
                  category={c.key}
                  categoryLabel={c.label}
                  actions={actions}
                  handle={handle}
                  dragging={dragging}
                />
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>

      <div className="flex items-center gap-2">
        <label htmlFor="today-category" className="sr-only">
          Category for the new task
        </label>
        <select
          id="today-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryKey)}
          className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {board.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="min-w-0 flex-1">
          <AddForm placeholder="New task for today" onAdd={(name) => onCreate(category, name)} />
        </div>
      </div>

      {finished.length > 0 && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => onClearFinished(finished.map((i) => i.sub.id))}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Clear finished from Today ({finished.length})
          </button>
        </div>
      )}

      {picking && (
        <AddToTodayDialog
          board={board}
          onAdd={(id) => actions.onSetToday(id, true)}
          onCreate={onCreate}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  );
}
