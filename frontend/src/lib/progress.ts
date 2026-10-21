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
