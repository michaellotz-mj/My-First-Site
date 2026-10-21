import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import AddForm from '../components/AddForm';
import EditableText from '../components/EditableText';
import { api } from '../lib/api';
import { activityProgress, subcategoryProgress, updateActivityInBoard } from '../lib/progress';
import type { CategoryBoard, Subcategory } from '../lib/types';
import { VERSION } from '../version';

export default function Home() {
  const [board, setBoard] = useState<CategoryBoard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setBoard(await api.board());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your list');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Runs a change against the API, then refreshes the board. */
  const mutate = useCallback(
    async (change: () => Promise<unknown>) => {
      try {
        await change();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
      await reload();
    },
    [reload],
  );

  /** Ticks instantly on screen, then saves; reload corrects it if the save fails. */
  const toggleActivity = useCallback(
    (id: number, done: boolean) => {
      setBoard((b) => b && updateActivityInBoard(b, id, { done }));
      return mutate(() => api.updateActivity(id, { done }));
    },
    [mutate],
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 text-slate-800">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">To Do List</h1>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">v{VERSION}</span>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!board && !error && <p className="text-slate-500">Loading…</p>}

      <div className="space-y-6">
        {board?.map((category) => {
          const progress = subcategoryProgress(category.subcategories);
          return (
            <section key={category.key} aria-labelledby={`cat-${category.key}`}>
              <div className="mb-2 flex items-baseline justify-between border-b border-slate-200 pb-1">
                <h2 id={`cat-${category.key}`} className="text-lg font-semibold">
                  {category.label}
                </h2>
                <span className="text-xs text-slate-500">
                  {progress.done}/{progress.total} complete
                </span>
              </div>
              <div className="space-y-3">
                {category.subcategories.map((sub) => (
                  <SubcategoryCard key={sub.id} sub={sub} mutate={mutate} onToggle={toggleActivity} />
                ))}
                <AddForm
                  placeholder={`New ${category.label} sub-category`}
                  onAdd={(name) => mutate(() => api.createSubcategory(category.key, name))}
                />
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

interface CardProps {
  sub: Subcategory;
  mutate: (change: () => Promise<unknown>) => Promise<void>;
  onToggle: (id: number, done: boolean) => Promise<void>;
}

function SubcategoryCard({ sub, mutate, onToggle }: CardProps) {
  const [open, setOpen] = useState(true);
  const progress = activityProgress(sub.activities);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? `Collapse ${sub.name}` : `Expand ${sub.name}`}
          className="p-1 text-slate-400"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <EditableText
          value={sub.name}
          struck={progress.complete}
          label={sub.name}
          className="font-medium"
          onSave={(name) => mutate(() => api.renameSubcategory(sub.id, name))}
        />
        <span className="shrink-0 text-xs text-slate-500">
          {progress.done}/{progress.total}
        </span>
        <button
          type="button"
          aria-label={`Delete ${sub.name}`}
          onClick={() => {
            if (confirm(`Delete "${sub.name}" and all its activities?`)) mutate(() => api.deleteSubcategory(sub.id));
          }}
          className="p-1 text-slate-300 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-1 pl-7">
          <ul className="space-y-1">
            {sub.activities.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.done}
                  onChange={() => onToggle(a.id, !a.done)}
                  aria-label={`Mark "${a.title}" ${a.done ? 'not done' : 'done'}`}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                />
                <EditableText
                  value={a.title}
                  struck={a.done}
                  label={a.title}
                  className="text-sm"
                  onSave={(title) => mutate(() => api.updateActivity(a.id, { title }))}
                />
                <button
                  type="button"
                  aria-label={`Delete ${a.title}`}
                  onClick={() => mutate(() => api.deleteActivity(a.id))}
                  className="p-1 text-slate-300 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <AddForm
            placeholder="New activity"
            onAdd={(title) => mutate(() => api.createActivity(sub.id, title))}
          />
        </div>
      )}
    </div>
  );
}
