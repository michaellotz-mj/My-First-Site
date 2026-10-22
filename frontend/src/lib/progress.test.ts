import { describe, expect, it } from 'vitest';
import {
  activityProgress,
  categoriesForTab,
  moveId,
  moveSubcategory,
  reorderActivitiesInBoard,
  reorderInBoard,
  splitCompleted,
  subcategoryProgress,
  updateActivityInBoard,
  updateSubcategoryInBoard,
} from './progress';

const act = (id: number, done: boolean) => ({ id, title: `a${id}`, done });

describe('activityProgress', () => {
  it('is complete when every activity is ticked', () =>
    expect(activityProgress([act(1, true), act(2, true)])).toEqual({ done: 2, total: 2, complete: true }));
  it('is not complete while any activity is open', () =>
    expect(activityProgress([act(1, true), act(2, false)])).toEqual({ done: 1, total: 2, complete: false }));
  it('treats an empty sub-category as not complete', () =>
    expect(activityProgress([])).toEqual({ done: 0, total: 0, complete: false }));
});

describe('subcategoryProgress', () => {
  it('counts sub-categories whose activities are all ticked', () => {
    const subs = [
      { id: 1, name: 'Done', notes: '', activities: [act(1, true)] },
      { id: 2, name: 'Open', notes: '', activities: [act(2, false)] },
      { id: 3, name: 'Empty', notes: '', activities: [] },
    ];
    expect(subcategoryProgress(subs)).toEqual({ done: 1, total: 3, complete: false });
  });
});

describe('updateActivityInBoard', () => {
  it('changes only the matching activity and leaves the input untouched', () => {
    const board = [
      { key: 'work' as const, label: 'Work', subcategories: [{ id: 1, name: 'S', notes: '', activities: [act(1, false), act(2, false)] }] },
    ];
    const next = updateActivityInBoard(board, 2, { done: true });
    expect(next[0].subcategories[0].activities).toEqual([act(1, false), act(2, true)]);
    expect(board[0].subcategories[0].activities[1].done).toBe(false);
  });
});

describe('categoriesForTab', () => {
  const board = (['work', 'business', 'other'] as const).map((key) => ({ key, label: key, subcategories: [] }));
  it('shows every category on the All tab', () =>
    expect(categoriesForTab(board, 'all').map((c) => c.key)).toEqual(['work', 'business', 'other']));
  it('shows only the selected category otherwise', () =>
    expect(categoriesForTab(board, 'business').map((c) => c.key)).toEqual(['business']));
});

const sub = (id: number, ...done: boolean[]) => ({ id, name: `s${id}`, notes: '', activities: done.map((d, i) => act(id * 10 + i, d)) });

describe('splitCompleted', () => {
  it('moves fully ticked sub-categories out, keeps empty and partial ones in progress', () => {
    const { active, completed } = splitCompleted([sub(1, true), sub(2), sub(3, true, false), sub(4, true, true)]);
    expect(active.map((s) => s.id)).toEqual([2, 3]);
    expect(completed.map((s) => s.id)).toEqual([1, 4]);
  });
});

describe('moveSubcategory', () => {
  const subs = [sub(1, false), sub(2, true), sub(3, false), sub(4, false)];
  it('swaps with the next in-progress neighbour, skipping completed ones', () =>
    expect(moveSubcategory(subs, 1, 'down')).toEqual([3, 1, 4, 2]));
  it('moves up', () => expect(moveSubcategory(subs, 4, 'up')).toEqual([1, 4, 3, 2]));
  it('returns null at either end', () => {
    expect(moveSubcategory(subs, 1, 'up')).toBeNull();
    expect(moveSubcategory(subs, 4, 'down')).toBeNull();
  });
  it('returns null for a completed sub-category', () => expect(moveSubcategory(subs, 2, 'up')).toBeNull());
});

describe('reorderInBoard', () => {
  it('reorders only the given category', () => {
    const board = [
      { key: 'work' as const, label: 'Work', subcategories: [sub(1), sub(2), sub(3)] },
      { key: 'other' as const, label: 'Other', subcategories: [sub(5), sub(6)] },
    ];
    const next = reorderInBoard(board, 'work', [3, 1, 2]);
    expect(next[0].subcategories.map((s) => s.id)).toEqual([3, 1, 2]);
    expect(next[1]).toBe(board[1]);
  });
});

describe('moveId', () => {
  it('swaps with the neighbour', () => {
    expect(moveId([1, 2, 3], 2, 'up')).toEqual([2, 1, 3]);
    expect(moveId([1, 2, 3], 2, 'down')).toEqual([1, 3, 2]);
  });
  it('returns null at the ends or for a missing id', () => {
    expect(moveId([1, 2], 1, 'up')).toBeNull();
    expect(moveId([1, 2], 2, 'down')).toBeNull();
    expect(moveId([1, 2], 9, 'up')).toBeNull();
  });
});

describe('reorderActivitiesInBoard', () => {
  it('reorders activities in one sub-category only', () => {
    const board = [{ key: 'work' as const, label: 'Work', subcategories: [sub(1, false, true, false), sub(2, false, false)] }];
    const next = reorderActivitiesInBoard(board, 1, [12, 10, 11]);
    expect(next[0].subcategories[0].activities.map((a) => a.id)).toEqual([12, 10, 11]);
    expect(next[0].subcategories[1]).toBe(board[0].subcategories[1]);
  });
});

describe('updateSubcategoryInBoard', () => {
  it('changes only the matching sub-category', () => {
    const board = [{ key: 'work' as const, label: 'Work', subcategories: [sub(1), sub(2)] }];
    const next = updateSubcategoryInBoard(board, 2, { notes: 'Call Sam' });
    expect(next[0].subcategories[1].notes).toBe('Call Sam');
    expect(next[0].subcategories[0]).toBe(board[0].subcategories[0]);
    expect(board[0].subcategories[1].notes).toBe('');
  });
});
