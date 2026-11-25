import { describe, expect, it } from 'vitest';
import { placeByDone } from './tickOrder';

const list = (...items: [number, boolean][]) => items.map(([id, done]) => ({ id, done }));

describe('placeByDone', () => {
  it('ticking moves an activity just below the unticked ones, above earlier ticked ones', () => {
    // A, B, C to do; D already ticked. Tick B -> A, C, B, D.
    expect(placeByDone(list([1, false], [2, true], [3, false], [4, true]), 2)).toEqual([1, 3, 2, 4]);
  });

  it('ticking the last unticked one leaves it at the top of the ticked ones', () => {
    expect(placeByDone(list([1, true], [2, true], [3, true]), 1)).toEqual([1, 2, 3]);
    expect(placeByDone(list([5, true], [1, true], [2, true]), 5)).toEqual([5, 1, 2]);
  });

  it('unticking moves it to the bottom of the still-to-do ones', () => {
    // A to do; B, C, D ticked. Untick D -> A, D, B, C.
    expect(placeByDone(list([1, false], [2, true], [3, true], [4, false]), 4)).toEqual([1, 4, 2, 3]);
  });

  it('unticking when nothing else is to do puts it at the top', () => {
    expect(placeByDone(list([1, true], [2, true], [3, false]), 3)).toEqual([3, 1, 2]);
  });

  it('regroups a mixed order (older data or dragged): to-do first, then ticked, each keeping its order', () => {
    expect(placeByDone(list([1, true], [2, false], [3, true], [4, false], [5, true]), 1)).toEqual([2, 4, 1, 3, 5]);
  });

  it('a new activity goes to the bottom of the to-do ones, above the ticked ones', () => {
    expect(placeByDone(list([1, false], [2, true], [3, false]), 3)).toEqual([1, 3, 2]);
  });
});
