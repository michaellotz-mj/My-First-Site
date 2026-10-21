import { describe, expect, it } from 'vitest';
import {
  parseActivityUpdate,
  parseId,
  parseNewActivity,
  parseNewSubcategory,
  parseReorder,
  parseSubcategoryUpdate,
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
      value: { category: 'work', name: 'Screening V2 config' },
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
  it('requires a name', () => expect(parseSubcategoryUpdate({}).ok).toBe(false));
  it('accepts a new name', () =>
    expect(parseSubcategoryUpdate({ name: 'Renamed' })).toEqual({ ok: true, value: { name: 'Renamed' } }));
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
