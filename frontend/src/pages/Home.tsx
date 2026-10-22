import { useCallback, useEffect, useMemo, useState } from 'react';
import AddForm from '../components/AddForm';
import CategoryTabs from '../components/CategoryTabs';
import CompletedSection, { COMPLETED_VIEWS, type CompletedView } from '../components/CompletedSection';
import { SortableItem, SortableList } from '../components/Sortable';
import SubcategoryCard, { type CardActions } from '../components/SubcategoryCard';
import TodayView from '../components/TodayView';
import { api } from '../lib/api';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import {
  activityProgress,
  categoriesForTab,
  nextTodayPosition,
  reorderTodayInBoard,
  todayItems,
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
const TABS: readonly Tab[] = ['today', 'all', 'work', 'business', 'other'];
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

  /** Adds to or removes from Today instantly on screen, then saves. */
  const setToday = useCallback(
    (id: number, today: boolean) => {
      setBoard(
        (b) => b && updateSubcategoryInBoard(b, id, today ? { today, todayPosition: nextTodayPosition(b) } : { today }),
      );
      return mutate(() => api.updateSubcategory(id, { today }));
    },
    [mutate],
  );

  /** Applies a dropped Today item instantly on screen, then saves the Today order. */
  const moveToday = useCallback(
    (activeId: number, overId: number) => {
      if (!board) return;
      const ids = moveSubcategory(todayItems(board).map((i) => i.sub), activeId, overId);
      if (!ids) return;
      setBoard((b) => b && reorderTodayInBoard(b, ids));
      return mutate(() => api.reorderToday(ids));
    },
    [board, mutate],
  );

  const actions: CardActions = useMemo(
    () => ({
      mutate,
      onToggle: toggleActivity,
      onMoveActivity: moveActivity,
      onSaveNotes: saveNotes,
      onSetToday: setToday,
    }),
    [mutate, toggleActivity, moveActivity, saveNotes, setToday],
  );

  const today = board ? todayItems(board) : [];
  const visible = board ? categoriesForTab(board, tab) : [];
  const completed =
    tab === 'today'
      ? today.filter((i) => activityProgress(i.sub.activities).complete)
      : visible.flatMap((c) => splitCompleted(c.subcategories).completed.map((sub) => ({ sub, category: c })));

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
          {board && tab === 'today' && (
            <TodayView
              board={board}
              items={today}
              actions={actions}
              onReorder={moveToday}
              onCreate={(category, name) => mutate(() => api.createSubcategory(category, name, true))}
              onClearFinished={(ids) =>
                mutate(() => Promise.all(ids.map((id) => api.updateSubcategory(id, { today: false }))))
              }
            />
          )}
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
                              actions={actions}
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
                actions={actions}
              />
            ))}
          </CompletedSection>
        </div>
      </main>
    </>
  );
}
