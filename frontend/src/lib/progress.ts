import type { Activity, CategoryBoard, CategoryKey, Subcategory } from './types';

export interface Progress {
  done: number;
  total: number;
  /** True only when there is at least one activity and every one is ticked. */
  complete: boolean;
}

export function activityProgress(activities: Activity[]): Progress {
  const done = activities.filter((a) => a.done).length;
  const total = activities.length;
  return { done, total, complete: total > 0 && done === total };
}

/** Counts completed sub-categories within a category. */
export function subcategoryProgress(subcategories: Subcategory[]): Progress {
  const done = subcategories.filter((s) => activityProgress(s.activities).complete).length;
  const total = subcategories.length;
  return { done, total, complete: total > 0 && done === total };
}

/** Returns a new board with one activity's fields changed — used for instant (optimistic) ticks. */
export function updateActivityInBoard(
  board: CategoryBoard[],
  id: number,
  changes: Partial<Omit<Activity, 'id'>>,
): CategoryBoard[] {
  return board.map((c) => ({
    ...c,
    subcategories: c.subcategories.map((s) => ({
      ...s,
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...changes } : a)),
    })),
  }));
}

export type Tab = 'all' | CategoryKey;

/** Categories shown for the selected tab: every category for "all", otherwise just that one. */
export function categoriesForTab(board: CategoryBoard[], tab: Tab): CategoryBoard[] {
  return tab === 'all' ? board : board.filter((c) => c.key === tab);
}

/** Splits sub-categories into those still in progress and those with every activity ticked, keeping order. */
export function splitCompleted(subcategories: Subcategory[]): { active: Subcategory[]; completed: Subcategory[] } {
  const active: Subcategory[] = [];
  const completed: Subcategory[] = [];
  for (const s of subcategories) (activityProgress(s.activities).complete ? completed : active).push(s);
  return { active, completed };
}

/**
 * New full order of a category's sub-category ids after moving one in-progress sub-category
 * up or down among the other in-progress ones. Completed ones keep their order at the end.
 * Returns null when it can't move (already at that end, or not in progress).
 */
export function moveSubcategory(subcategories: Subcategory[], id: number, direction: 'up' | 'down'): number[] | null {
  const { active, completed } = splitCompleted(subcategories);
  const from = active.findIndex((s) => s.id === id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= active.length) return null;
  const ids = active.map((s) => s.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return [...ids, ...completed.map((s) => s.id)];
}

/** Returns a new board with one category's sub-categories put in the given id order (optimistic reorder). */
export function reorderInBoard(board: CategoryBoard[], category: CategoryKey, ids: number[]): CategoryBoard[] {
  return board.map((c) => {
    if (c.key !== category) return c;
    const rank = new Map(ids.map((id, i) => [id, i]));
    const subcategories = [...c.subcategories].sort(
      (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
    );
    return { ...c, subcategories };
  });
}
