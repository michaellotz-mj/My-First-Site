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
  urgency: 2,
  activities: done.map((d, i) => ({ id: id * 10 + i, title: `a${i}`, done: d })),
});

const board: CategoryBoard[] = [
  { key: 'work', label: 'Work', subcategories: [sub(1, 'Screening', [false]), sub(2, 'Report', [true])] },
  { key: 'business', label: 'Business', subcategories: [sub(3, 'Website', [false], true)] },
  { key: 'other', label: 'Other', subcategories: [sub(4, 'Gym', [])] },
];

describe('AddToTodayDialog', () => {
  it('lists every category, marks ones already on Today, and leaves out finished ones', () => {
    render(<AddToTodayDialog board={board} onAdd={vi.fn()} onCreate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Work' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Business' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Other' })).toBeTruthy();
    expect(screen.getByLabelText('Add Screening to Today')).toBeTruthy();
    expect(screen.getByLabelText('Add Gym to Today')).toBeTruthy();
    expect(screen.queryByText('Report')).toBeNull(); // finished
    expect(screen.queryByLabelText('Add Website to Today')).toBeNull(); // already on Today…
    expect(screen.getByText('Website')).toBeTruthy(); // …but still shown
    expect(screen.getByText('On Today')).toBeTruthy();
  });

  it('shows an empty category with a way to add to it', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const empty = board.map((c) => (c.key === 'other' ? { ...c, subcategories: [] } : c));
    render(<AddToTodayDialog board={empty} onAdd={vi.fn()} onCreate={onCreate} onClose={vi.fn()} />);
    expect(screen.getByText('No unfinished Other sub-categories yet.')).toBeTruthy();
    const box = screen.getByRole('textbox', { name: 'New Other sub-category' });
    fireEvent.change(box, { target: { value: 'Book dentist' } });
    fireEvent.submit(box.closest('form')!);
    expect(onCreate).toHaveBeenCalledWith('other', 'Book dentist');
  });

  it('adds the chosen one and stays open', () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddToTodayDialog board={board} onAdd={onAdd} onCreate={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Add Gym to Today'));
    expect(onAdd).toHaveBeenCalledWith(4);
    expect(onClose).not.toHaveBeenCalled();
  });
});
