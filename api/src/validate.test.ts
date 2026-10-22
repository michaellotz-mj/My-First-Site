import { describe, expect, it } from 'vitest';
import {
  parseActivityReorder,
  parseActivityUpdate,
  parseId,
  parseNewActivity,
  parseNewSubcategory,
  parseReorder,
  parseSubcategoryUpdate,
  parseTodayReorder,
} from './validate';

describe('parseId', () => {
  it('accepts positive integers', () => expect(parseId('42')).toEqual({ ok: true, value: 42 }));
  it.each(['0', '-1', 'abc', '1.5', '', '9999999999'])('rejects %j', (raw) =>
    expect(parseId(raw).ok).toBe(false));
});

describe('parseNewSubcategory', () => {
  it('trims the name', () =>
    expect(parseNewSubcategory({ category: 'work', name: '  Screening V2 config ' })).toEqual({
      ok: true,
      value: { category: 'work', name: 'Screening V2 config', today: false },
    }));
  it('rejects unknown categories', () =>
    expect(parseNewSubcategory({ category: 'home', name: 'x' }).ok).toBe(false));
  it('rejects blank names', () =>
    expect(parseNewSubcategory({ category: 'work', name: '   ' }).ok).toBe(false));
  it('rejects over-long names', () =>
    expect(parseNewSubcategory({ category: 'work', name: 'a'.repeat(201) }).ok).toBe(false));
  it('rejects non-objects', () => expect(parseNewSubcategory(null).ok).toBe(false));
});

describe('parseSubcategoryUpdate', () => {
  it('rejects an empty update', () => expect(parseSubcategoryUpdate({}).ok).toBe(false));
  it('accepts a new name, leaving notes unchanged', () =>
    expect(parseSubcategoryUpdate({ name: 'Renamed' })).toEqual({ ok: true, value: { name: 'Renamed', notes: null, today: null, urgency: null } }));
  it('accepts notes as written, including line breaks', () =>
    expect(parseSubcategoryUpdate({ notes: '  Call Sam\n- ask about v2 ' })).toEqual({
      ok: true,
      value: { name: null, notes: '  Call Sam\n- ask about v2 ', today: null, urgency: null },
    }));
  it('accepts empty notes (clears them)', () =>
    expect(parseSubcategoryUpdate({ notes: '' })).toEqual({ ok: true, value: { name: null, notes: '', today: null, urgency: null } }));
  it('rejects a blank name and non-string or over-long notes', () => {
    expect(parseSubcategoryUpdate({ name: ' ' }).ok).toBe(false);
    expect(parseSubcategoryUpdate({ notes: 5 }).ok).toBe(false);
    expect(parseSubcategoryUpdate({ notes: 'x'.repeat(10001) }).ok).toBe(false);
  });
});

describe('parseNewActivity', () => {
  it('accepts a title', () =>
    expect(parseNewActivity({ title: 'Draft config' })).toEqual({ ok: true, value: { title: 'Draft config' } }));
  it('rejects a missing title', () => expect(parseNewActivity({}).ok).toBe(false));
});

describe('parseActivityUpdate', () => {
  it('returns null for omitted fields (never undefined)', () =>
    expect(parseActivityUpdate({ done: true })).toEqual({ ok: true, value: { title: null, done: true } }));
  it('accepts title only', () =>
    expect(parseActivityUpdate({ title: 'x' })).toEqual({ ok: true, value: { title: 'x', done: null } }));
  it('rejects an empty update', () => expect(parseActivityUpdate({}).ok).toBe(false));
  it('rejects non-boolean done', () => expect(parseActivityUpdate({ done: 'yes' }).ok).toBe(false));
});

describe('parseReorder', () => {
  it('accepts a category and unique positive ids', () =>
    expect(parseReorder({ category: 'work', ids: [3, 1, 2] })).toEqual({
      ok: true,
      value: { category: 'work', ids: [3, 1, 2] },
    }));
  it.each([
    [{ category: 'work', ids: [] }],
    [{ category: 'work', ids: [1, 1] }],
    [{ category: 'work', ids: [1, 'x'] }],
    [{ category: 'work', ids: [0] }],
    [{ category: 'home', ids: [1] }],
    [{ category: 'work' }],
  ])('rejects %j', (body) => expect(parseReorder(body).ok).toBe(false));
});

describe('parseActivityReorder', () => {
  it('accepts unique positive ids', () =>
    expect(parseActivityReorder({ ids: [2, 1] })).toEqual({ ok: true, value: { ids: [2, 1] } }));
  it.each([[{}], [{ ids: [] }], [{ ids: [1, 1] }], [{ ids: [-1] }], [null]])('rejects %j', (body) =>
    expect(parseActivityReorder(body).ok).toBe(false));
});

describe('Today', () => {
  it('new sub-categories can go straight onto Today', () =>
    expect(parseNewSubcategory({ category: 'other', name: 'Gym', today: true })).toEqual({
      ok: true,
      value: { category: 'other', name: 'Gym', today: true },
    }));
  it('rejects a non-boolean today', () => {
    expect(parseNewSubcategory({ category: 'other', name: 'Gym', today: 'yes' }).ok).toBe(false);
    expect(parseSubcategoryUpdate({ today: 1 }).ok).toBe(false);
  });
  it('accepts adding to and removing from Today', () => {
    expect(parseSubcategoryUpdate({ today: true })).toEqual({ ok: true, value: { name: null, notes: null, today: true, urgency: null } });
    expect(parseSubcategoryUpdate({ today: false })).toEqual({ ok: true, value: { name: null, notes: null, today: false, urgency: null } });
  });
  it('validates the Today order', () => {
    expect(parseTodayReorder({ ids: [4, 2] })).toEqual({ ok: true, value: { ids: [4, 2] } });
    expect(parseTodayReorder({ ids: [] }).ok).toBe(false);
  });
});

describe('urgency', () => {
  it.each([1, 2, 3])('accepts %i', (urgency) =>
    expect(parseSubcategoryUpdate({ urgency })).toEqual({
      ok: true,
      value: { name: null, notes: null, today: null, urgency },
    }));
  it.each([0, 4, 1.5, '1', null])('rejects %j', (urgency) => expect(parseSubcategoryUpdate({ urgency }).ok).toBe(false));
});
