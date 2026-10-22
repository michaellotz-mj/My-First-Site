import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AddToTodayDialog from './AddToTodayDialog';
import type { CategoryBoard, Subcategory } from '../lib/types';

afterEach(cleanup);

const sub = (id: number, name: string, done: boolean[], today = false): Subcategory => ({
  id,
  name,
  notes: '',
  today,
  todayPosition: 0,
  activities: done.map((d, i) => ({ id: id * 10 + i, title: `a${i}`, done: d })),
});

const board: CategoryBoard[] = [
  { key: 'work', label: 'Work', subcategories: [sub(1, 'Screening', [false]), sub(2, 'Report', [true])] },
  { key: 'business', label: 'Business', subcategories: [sub(3, 'Website', [false], true)] },
  { key: 'other', label: 'Other', subcategories: [sub(4, 'Gym', [])] },
];

describe('AddToTodayDialog', () => {
  it('offers only unfinished sub-categories that are not already on Today, grouped by category', () => {
    render(<AddToTodayDialog board={board} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Add Screening to Today')).toBeTruthy();
    expect(screen.getByLabelText('Add Gym to Today')).toBeTruthy();
    expect(screen.queryByLabelText('Add Report to Today')).toBeNull(); // finished
    expect(screen.queryByLabelText('Add Website to Today')).toBeNull(); // already on Today
    expect(screen.queryByText('Business')).toBeNull(); // nothing left to add there
  });

  it('adds the chosen one and stays open', () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddToTodayDialog board={board} onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Add Gym to Today'));
    expect(onAdd).toHaveBeenCalledWith(4);
    expect(onClose).not.toHaveBeenCalled();
  });
});
