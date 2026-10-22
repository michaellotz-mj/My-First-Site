import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react';
import AddForm from '../components/AddForm';
import CategoryTabs from '../components/CategoryTabs';
import CompletedSection, { COMPLETED_VIEWS, type CompletedView } from '../components/CompletedSection';
import ConfirmDelete from '../components/ConfirmDelete';
import EditableText from '../components/EditableText';
import NotesDialog from '../components/NotesDialog';
import { SortableItem, SortableList } from '../components/Sortable';
import { api } from '../lib/api';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import {
  activityProgress,
  categoriesForTab,
  moveIdTo,
  moveSubcategory,
  reorderActivitiesInBoard,
  reorderInBoard,
  splitCompleted,
  subcategoryProgress,
  updateActivityInBoard,
  updateSubcategoryInBoard,
  type Tab,
} from '../lib/progress';
import { loadChoice, saveChoice } from '../lib/storage';
import type { CategoryBoard, CategoryKey, Subcategory } from '../lib/types';
import { VERSION } from '../version';

const TAB_KEY = 'todo-tab';
const TABS: readonly Tab[] = ['all', 'work', 'business', 'other'];
const COMPLETED_KEY = 'todo-completed-view';

export default function Home() {
  const [board, setBoard] = useState<CategoryBoard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(() => loadChoice(TAB_KEY, TABS, 'all'));
  const [completedView, setCompletedView] = useState<CompletedView>(() =>
    loadChoice(COMPLETED_KEY, COMPLETED_VIEWS, 'open'),
  );

  const selectTab = useCallback((next: Tab) => {
    setTab(next);
    saveChoice(TAB_KEY, next);
  }, []);

  const changeCompletedView = useCallback((next: CompletedView) => {
    setCompletedView(next);
    saveChoice(COMPLETED_KEY, next);
  }, []);

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

  /** Applies a dropped sub-category instantly on screen, then saves the category's new order. */
  const moveSub = useCallback(
    (category: CategoryKey, subcategories: Subcategory[], activeId: number, overId: number) => {
      const ids = moveSubcategory(subcategories, activeId, overId);
      if (!ids) return;
      setBoard((b) => b && reorderInBoard(b, category, ids));
      return mutate(() => api.reorderSubcategories(category, ids));
    },
    [mutate],
  );

  /** Applies a dropped activity instantly on screen, then saves the sub-category's new activity order. */
  const moveActivity = useCallback(
    (sub: Subcategory, activeId: number, overId: number) => {
      const ids = moveIdTo(sub.activities.map((a) => a.id), activeId, overId);
      if (!ids) return;
      setBoard((b) => b && reorderActivitiesInBoard(b, sub.id, ids));
      return mutate(() => api.reorderActivities(sub.id, ids));
    },
    [mutate],
  );

  /** Saves notes instantly on screen, then to the API; reload corrects it if the save fails. */
  const saveNotes = useCallback(
    (id: number, notes: string) => {
      setBoard((b) => b && updateSubcategoryInBoard(b, id, { notes }));
      return mutate(() => api.updateSubcategory(id, { notes }));
    },
    [mutate],
  );

  const visible = board ? categoriesForTab(board, tab) : [];
  const completed = visible.flatMap((c) =>
    splitCompleted(c.subcategories).completed.map((sub) => ({ sub, category: c })),
  );

  return (
    <>
      <header className="bg-brand text-white">
        <div className="mx-auto flex max-w-2xl items-end justify-between px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-soft">Lotz Solutions</p>
            <h1 className="text-2xl font-bold">To Do List</h1>
          </div>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-brand-soft">v{VERSION}</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 text-slate-800">
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!board && !error && <p className="text-slate-500">Loading…</p>}

        {board && <CategoryTabs board={board} tab={tab} onChange={selectTab} />}

        <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-6">
          {visible.map((category) => {
            const progress = subcategoryProgress(category.subcategories);
            const styles = CATEGORY_STYLES[category.key];
            const { active } = splitCompleted(category.subcategories);
            return (
              <section key={category.key} aria-labelledby={`cat-${category.key}`}>
                <div className="mb-2 flex items-center justify-between border-b border-slate-300/70 pb-1.5">
                  <h2 id={`cat-${category.key}`} className="flex items-center gap-2 text-lg font-semibold">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                    {category.label}
                  </h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.pill}`}>
                    {progress.done}/{progress.total} complete
                  </span>
                </div>
                <div className="space-y-3">
                  {active.length === 0 && progress.total > 0 && (
                    <p className="text-sm text-slate-500">Everything here is done.</p>
                  )}
                  <SortableList
                    ids={active.map((s) => s.id)}
                    nameOf={(id) => active.find((s) => s.id === id)?.name ?? 'sub-category'}
                    onReorder={(activeId, overId) => moveSub(category.key, category.subcategories, activeId, overId)}
                  >
                    <div className="space-y-3">
                      {active.map((sub) => (
                        <SortableItem
                          key={sub.id}
                          id={sub.id}
                          handleLabel={`Reorder ${sub.name}`}
                          disabled={active.length < 2}
                        >
                          {(handle, dragging) => (
                            <SubcategoryCard
                              sub={sub}
                              category={category.key}
                              mutate={mutate}
                              onToggle={toggleActivity}
                              onMoveActivity={moveActivity}
                              onSaveNotes={saveNotes}
                              handle={handle}
                              dragging={dragging}
                            />
                          )}
                        </SortableItem>
                      ))}
                    </div>
                  </SortableList>
                  <AddForm
                    placeholder={`New ${category.label} sub-category`}
                    onAdd={(name) => mutate(() => api.createSubcategory(category.key, name))}
                  />
                </div>
              </section>
            );
          })}

          <CompletedSection count={completed.length} view={completedView} onViewChange={changeCompletedView}>
            {completed.map(({ sub, category }) => (
              <SubcategoryCard
                key={sub.id}
                sub={sub}
                category={category.key}
                categoryLabel={category.label}
                defaultOpen={false}
                mutate={mutate}
                onToggle={toggleActivity}
                onMoveActivity={moveActivity}
                onSaveNotes={saveNotes}
              />
            ))}
          </CompletedSection>
        </div>
      </main>
    </>
  );
}

interface CardProps {
  sub: Subcategory;
  category: CategoryKey;
  mutate: (change: () => Promise<unknown>) => Promise<void>;
  onToggle: (id: number, done: boolean) => Promise<void>;
  onMoveActivity: (sub: Subcategory, activeId: number, overId: number) => void;
  onSaveNotes: (id: number, notes: string) => void;
  /** Drag handle for reordering (in-progress cards only). */
  handle?: ReactNode;
  dragging?: boolean;
  /** Shown as a small tag, for cards in the mixed Completed section. */
  categoryLabel?: string;
  defaultOpen?: boolean;
}

function SubcategoryCard({
  sub,
  category,
  mutate,
  onToggle,
  onMoveActivity,
  onSaveNotes,
  handle,
  dragging,
  categoryLabel,
  defaultOpen = true,
}: CardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [notesOpen, setNotesOpen] = useState(false);
  const hasNotes = sub.notes.trim() !== '';
  const progress = activityProgress(sub.activities);
  const styles = CATEGORY_STYLES[category];
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 ${dragging ? 'shadow-lg ring-1 ring-slate-300' : 'shadow-sm'}`}
    >
      <div className="flex items-center gap-1">
        {handle}
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
          onSave={(name) => mutate(() => api.updateSubcategory(sub.id, { name }))}
        />
        <button
          type="button"
          aria-label={hasNotes ? `Notes for ${sub.name} (has notes)` : `Add notes for ${sub.name}`}
          title={hasNotes ? 'View notes' : 'Add notes'}
          onClick={() => setNotesOpen(true)}
          className={`shrink-0 rounded p-1 hover:bg-slate-100 ${hasNotes ? styles.text : 'text-slate-300 hover:text-slate-600'}`}
        >
          <StickyNote size={15} fill={hasNotes ? 'currentColor' : 'none'} fillOpacity={0.15} />
        </button>
        {notesOpen && (
          <NotesDialog
            title={sub.name}
            notes={sub.notes}
            onSave={(notes) => onSaveNotes(sub.id, notes)}
            onClose={() => setNotesOpen(false)}
          />
        )}
        {categoryLabel && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles.pill}`}>{categoryLabel}</span>
        )}
        <span className="shrink-0 text-xs text-slate-500 tabular-nums">
          {progress.done}/{progress.total}
        </span>
        <ConfirmDelete
          label={sub.name}
          question={
            sub.activities.length
              ? `Delete (${sub.activities.length} ${sub.activities.length === 1 ? 'activity' : 'activities'})?`
              : 'Delete?'
          }
          onConfirm={() => mutate(() => api.deleteSubcategory(sub.id))}
        />
      </div>
      <div
        role="progressbar"
        aria-label={`${sub.name} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={`mt-2 h-1 overflow-hidden rounded-full bg-slate-100 ${handle ? 'ml-14' : 'ml-7'}`}
      >
        <div className={`h-full rounded-full transition-[width] ${styles.bar}`} style={{ width: `${percent}%` }} />
      </div>

      {open && (
        <div className="mt-2 space-y-1 pl-7">
          <SortableList
            ids={sub.activities.map((a) => a.id)}
            nameOf={(id) => sub.activities.find((a) => a.id === id)?.title ?? 'activity'}
            onReorder={(activeId, overId) => onMoveActivity(sub, activeId, overId)}
          >
            <ul className="space-y-1">
              {sub.activities.map((a) => (
                <SortableItem
                  key={a.id}
                  id={a.id}
                  as="li"
                  handleLabel={`Reorder ${a.title}`}
                  disabled={sub.activities.length < 2}
                >
                  {(activityHandle, activityDragging) => (
                    <div
                      className={`flex items-center gap-2 rounded bg-white ${activityDragging ? 'shadow-md ring-1 ring-slate-200' : ''}`}
                    >
                      {activityHandle}
                      <input
                        type="checkbox"
                        checked={a.done}
                        onChange={() => onToggle(a.id, !a.done)}
                        aria-label={`Mark "${a.title}" ${a.done ? 'not done' : 'done'}`}
                        className={`h-4 w-4 shrink-0 ${styles.check}`}
                      />
                      <EditableText
                        value={a.title}
                        struck={a.done}
                        label={a.title}
                        className="text-sm"
                        onSave={(title) => mutate(() => api.updateActivity(a.id, { title }))}
                      />
                      <ConfirmDelete label={a.title} onConfirm={() => mutate(() => api.deleteActivity(a.id))} />
                    </div>
                  )}
                </SortableItem>
              ))}
            </ul>
          </SortableList>
          <AddForm
            placeholder="New activity"
            onAdd={(title) => mutate(() => api.createActivity(sub.id, title))}
          />
        </div>
      )}
    </div>
  );
}
