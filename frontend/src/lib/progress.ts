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

export type Tab = 'today' | 'all' | CategoryKey;

/** Categories shown for the selected tab: every category for "all", none for "today", otherwise just that one. */
export function categoriesForTab(board: CategoryBoard[], tab: Tab): CategoryBoard[] {
  return tab === 'all' ? board : board.filter((c) => c.key === tab);
}

/** A sub-category with the category it lives in, for lists that mix categories (Today, Completed). */
export interface PlacedSubcategory {
  sub: Subcategory;
  category: CategoryBoard;
}

/** Everything on the Today list, in Today order. */
export function todayItems(board: CategoryBoard[]): PlacedSubcategory[] {
  return board
    .flatMap((category) => category.subcategories.filter((s) => s.today).map((sub) => ({ sub, category })))
    .sort((a, b) => a.sub.todayPosition - b.sub.todayPosition || a.sub.id - b.sub.id);
}

/** Returns a new board with Today positions set from the given id order (optimistic reorder). */
export function reorderTodayInBoard(board: CategoryBoard[], ids: number[]): CategoryBoard[] {
  const rank = new Map(ids.map((id, i) => [id, i + 1]));
  return board.map((c) => ({
    ...c,
    subcategories: c.subcategories.map((s) => (rank.has(s.id) ? { ...s, todayPosition: rank.get(s.id)! } : s)),
  }));
}

/** Position for a sub-category joining Today: after everything already there. */
export function nextTodayPosition(board: CategoryBoard[]): number {
  return Math.max(0, ...board.flatMap((c) => c.subcategories.filter((s) => s.today).map((s) => s.todayPosition))) + 1;
}

/** Splits sub-categories into those still in progress and those with every activity ticked, keeping order. */
export function splitCompleted(subcategories: Subcategory[]): { active: Subcategory[]; completed: Subcategory[] } {
  const active: Subcategory[] = [];
  const completed: Subcategory[] = [];
  for (const s of subcategories) (activityProgress(s.activities).complete ? completed : active).push(s);
  return { active, completed };
}

/**
 * Ids after dragging `activeId` to where `overId` is (the others shift to make room).
 * Returns null when nothing moves (same id, or either id missing).
 */
export function moveIdTo(ids: number[], activeId: number, overId: number): number[] | null {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/**
 * New full order of a category's sub-category ids after dragging one in-progress sub-category
 * onto another. Completed ones keep their order at the end. Null when nothing moves.
 */
export function moveSubcategory(subcategories: Subcategory[], activeId: number, overId: number): number[] | null {
  const { active, completed } = splitCompleted(subcategories);
  const moved = moveIdTo(active.map((s) => s.id), activeId, overId);
  return moved && [...moved, ...completed.map((s) => s.id)];
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

/** Returns a new board with one sub-category's activities put in the given id order (optimistic reorder). */
export function reorderActivitiesInBoard(board: CategoryBoard[], subcategoryId: number, ids: number[]): CategoryBoard[] {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return board.map((c) => ({
    ...c,
    subcategories: c.subcategories.map((s) =>
      s.id !== subcategoryId
        ? s
        : { ...s, activities: [...s.activities].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)) },
    ),
  }));
}

/** Returns a new board with one sub-category's fields changed (optimistic rename / notes save). */
export function updateSubcategoryInBoard(
  board: CategoryBoard[],
  id: number,
  changes: Partial<Pick<Subcategory, 'name' | 'notes' | 'today' | 'todayPosition'>>,
): CategoryBoard[] {
  return board.map((c) => ({
    ...c,
    subcategories: c.subcategories.map((s) => (s.id === id ? { ...s, ...changes } : s)),
  }));
}
