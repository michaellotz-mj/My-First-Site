import { describe, expect, it } from 'vitest';
import { placeByUrgency, type Ranked } from './urgency';

const item = (id: number, urgency: number, complete = false): Ranked => ({ id, urgency, complete });
// Top to bottom: two 1s, two 2s, two 3s.
const list = [item(1, 1), item(2, 1), item(3, 2), item(4, 2), item(5, 3), item(6, 3)];

describe('placeByUrgency', () => {
  it('a new 1 goes to the very top', () => expect(placeByUrgency(list, 6, 1)).toEqual([6, 1, 2, 3, 4, 5]));
  it('a new 2 goes just below the last 1', () => expect(placeByUrgency(list, 6, 2)).toEqual([1, 2, 6, 3, 4, 5]));
  it('a new 3 goes just below the last 2', () => expect(placeByUrgency(list, 1, 3)).toEqual([2, 3, 4, 1, 5, 6]));
  it('a 1 dropped to 2 goes below the remaining 1s', () => expect(placeByUrgency(list, 1, 2)).toEqual([2, 1, 3, 4, 5, 6]));
  it('a 3 with no 2s around goes just below the 1s', () =>
    expect(placeByUrgency([item(1, 1), item(2, 3), item(3, 3)], 3, 3)).toEqual([1, 3, 2]));
  it('anchors on the last more-urgent item even after manual dragging', () =>
    expect(placeByUrgency([item(1, 2), item(2, 1), item(3, 3), item(4, 3)], 4, 2)).toEqual([1, 2, 4, 3]));
  it('ignores finished items when finding where to go', () =>
    expect(placeByUrgency([item(1, 2), item(2, 3), item(9, 1, true)], 2, 2)).toEqual([2, 1, 9]));
  it('with nothing more urgent, goes to the top', () =>
    expect(placeByUrgency([item(1, 3), item(2, 3)], 2, 2)).toEqual([2, 1]));
});
