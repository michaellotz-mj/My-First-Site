import { describe, expect, it } from 'vitest';
import {
  activityProgress,
  categoriesForTab,
  moveIdTo,
  moveSubcategory,
  nextTodayPosition,
  reorderTodayInBoard,
  setUrgencyInBoard,
  todayItems,
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
      { id: 1, name: 'Done', notes: '', today: false, todayPosition: 0, urgency: 2 as const, activities: [act(1, true)] },
      { id: 2, name: 'Open', notes: '', today: false, todayPosition: 0, urgency: 2 as const, activities: [act(2, false)] },
      { id: 3, name: 'Empty', notes: '', today: false, todayPosition: 0, urgency: 2 as const, activities: [] },
    ];
    expect(subcategoryProgress(subs)).toEqual({ done: 1, total: 3, complete: false });
  });
});

describe('updateActivityInBoard', () => {
  it('changes only the matching activity and leaves the input untouched', () => {
    const board = [
      { key: 'work' as const, label: 'Work', subcategories: [{ id: 1, name: 'S', notes: '', today: false, todayPosition: 0, urgency: 2 as const, activities: [act(1, false), act(2, false)] }] },
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

const sub = (id: number, ...done: boolean[]) => ({ id, name: `s${id}`, notes: '', today: false, todayPosition: 0, urgency: 2 as const, activities: done.map((d, i) => act(id * 10 + i, d)) });

describe('splitCompleted', () => {
  it('moves fully ticked sub-categories out, keeps empty and partial ones in progress', () => {
    const { active, completed } = splitCompleted([sub(1, true), sub(2), sub(3, true, false), sub(4, true, true)]);
    expect(active.map((s) => s.id)).toEqual([2, 3]);
    expect(completed.map((s) => s.id)).toEqual([1, 4]);
  });
});

describe('moveSubcategory', () => {
  const subs = [sub(1, false), sub(2, true), sub(3, false), sub(4, false)];
  it('drops one in-progress sub-category onto another, completed ones stay at the end', () => {
    expect(moveSubcategory(subs, 1, 4)).toEqual([3, 4, 1, 2]);
    expect(moveSubcategory(subs, 4, 1)).toEqual([4, 1, 3, 2]);
  });
  it('returns null when dropped on itself or involving a completed one', () => {
    expect(moveSubcategory(subs, 3, 3)).toBeNull();
    expect(moveSubcategory(subs, 2, 1)).toBeNull();
  });
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

describe('moveIdTo', () => {
  it('moves down, shifting the ones in between up', () => expect(moveIdTo([1, 2, 3, 4], 1, 3)).toEqual([2, 3, 1, 4]));
  it('moves up, shifting the ones in between down', () => expect(moveIdTo([1, 2, 3, 4], 4, 2)).toEqual([1, 4, 2, 3]));
  it('returns null for no-op or unknown ids', () => {
    expect(moveIdTo([1, 2], 1, 1)).toBeNull();
    expect(moveIdTo([1, 2], 9, 1)).toBeNull();
    expect(moveIdTo([1, 2], 1, 9)).toBeNull();
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

describe('Today', () => {
  const onToday = (id: number, todayPosition: number) => ({ ...sub(id), today: true, todayPosition });
  const board = [
    { key: 'work' as const, label: 'Work', subcategories: [onToday(1, 2), sub(2)] },
    { key: 'other' as const, label: 'Other', subcategories: [onToday(3, 1)] },
  ];
  it('collects Today items from every category, in Today order, with their category', () =>
    expect(todayItems(board).map((i) => [i.sub.id, i.category.key])).toEqual([
      [3, 'other'],
      [1, 'work'],
    ]));
  it('puts a newly added item after everything already on Today', () => expect(nextTodayPosition(board)).toBe(3));
  it('starts at 1 when Today is empty', () => expect(nextTodayPosition([])).toBe(1));
  it('reorders Today without touching category order', () => {
    const next = reorderTodayInBoard(board, [1, 3]);
    expect(todayItems(next).map((i) => i.sub.id)).toEqual([1, 3]);
    expect(next[0].subcategories.map((s) => s.id)).toEqual([1, 2]);
  });
  it('the All tab is unaffected by Today', () => expect(categoriesForTab(board, 'all')).toBe(board));
});

describe('setUrgencyInBoard', () => {
  const board = [
    {
      key: 'work' as const,
      label: 'Work',
      subcategories: [
        { ...sub(1), today: true, todayPosition: 1 },
        sub(2),
        { ...sub(3), today: true, todayPosition: 2 },
      ],
    },
  ];
  it('setting 1 moves it to the top of its category and of Today', () => {
    const next = setUrgencyInBoard(board, 3, 1);
    expect(next[0].subcategories.map((s) => s.id)).toEqual([3, 1, 2]);
    expect(next[0].subcategories[0].urgency).toBe(1);
    expect(todayItems(next).map((i) => i.sub.id)).toEqual([3, 1]);
  });
  it('setting 2 or 3 leaves it in place', () => {
    const next = setUrgencyInBoard(board, 3, 3);
    expect(next[0].subcategories.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(next[0].subcategories[2].urgency).toBe(3);
  });
  it('setting 1 when it is already 1 does not move it', () => {
    const urgent = [{ ...board[0], subcategories: [sub(1), { ...sub(2), urgency: 1 as const }] }];
    expect(setUrgencyInBoard(urgent, 2, 1)[0].subcategories.map((s) => s.id)).toEqual([1, 2]);
  });
});
