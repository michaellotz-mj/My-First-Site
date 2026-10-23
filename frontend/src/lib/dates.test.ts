import { describe, expect, it } from 'vitest';
import { localDayKey, startOfLocalDay } from './dates';

describe('local day helpers', () => {
  it('start of day is local midnight of the same date', () => {
    const start = startOfLocalDay(new Date(2026, 9, 22, 7, 45, 12));
    expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes()]).toEqual([
      2026, 9, 22, 0, 0,
    ]);
  });
  it('day key changes at local midnight, not before', () => {
    expect(localDayKey(new Date(2026, 9, 22, 23, 59))).toBe('2026-10-22');
    expect(localDayKey(new Date(2026, 9, 23, 0, 0))).toBe('2026-10-23');
  });
});
