import { describe, expect, it } from 'vitest';
import { buildBoard } from './board';

describe('buildBoard', () => {
  it('always returns Work, Business, Other in order, even when empty', () => {
    expect(buildBoard([], []).map((c) => c.label)).toEqual(['Work', 'Business', 'Other']);
  });

  it('nests activities under their subcategory, ordered by position', () => {
    const board = buildBoard(
      [
        { id: 2, category: 'work', name: 'B', notes: '', position: 2 },
        { id: 1, category: 'work', name: 'A', notes: '', position: 1 },
        { id: 3, category: 'other', name: 'C', notes: '', position: 1 },
      ],
      [
        { id: 11, subcategory_id: 1, title: 'second', done: true, position: 2 },
        { id: 10, subcategory_id: 1, title: 'first', done: false, position: 1 },
      ],
    );
    const work = board[0];
    expect(work.subcategories.map((s) => s.name)).toEqual(['A', 'B']);
    expect(work.subcategories[0].activities.map((a) => a.title)).toEqual(['first', 'second']);
    expect(work.subcategories[1].activities).toEqual([]);
    expect(board[1].subcategories).toEqual([]);
    expect(board[2].subcategories.map((s) => s.name)).toEqual(['C']);
  });
});
