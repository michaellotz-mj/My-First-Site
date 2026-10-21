import { describe, expect, it } from 'vitest';
import { activityProgress, categoriesForTab, subcategoryProgress, updateActivityInBoard } from './progress';

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
      { id: 1, name: 'Done', activities: [act(1, true)] },
      { id: 2, name: 'Open', activities: [act(2, false)] },
      { id: 3, name: 'Empty', activities: [] },
    ];
    expect(subcategoryProgress(subs)).toEqual({ done: 1, total: 3, complete: false });
  });
});

describe('updateActivityInBoard', () => {
  it('changes only the matching activity and leaves the input untouched', () => {
    const board = [
      { key: 'work' as const, label: 'Work', subcategories: [{ id: 1, name: 'S', activities: [act(1, false), act(2, false)] }] },
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
