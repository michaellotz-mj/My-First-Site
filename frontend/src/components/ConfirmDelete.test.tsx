import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ConfirmDelete from './ConfirmDelete';

afterEach(cleanup);

describe('ConfirmDelete', () => {
  it('asks before deleting and deletes on Yes', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDelete label="Draft config" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText('Delete Draft config'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Delete?')).toBeTruthy();
    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does nothing on No, and focuses No first', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDelete label="Draft config" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText('Delete Draft config'));
    expect(document.activeElement).toBe(screen.getByText('No'));
    fireEvent.click(screen.getByText('No'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Delete Draft config')).toBeTruthy();
  });

  it('Escape cancels', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDelete label="Draft config" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText('Delete Draft config'));
    fireEvent.keyDown(screen.getByText('No'), { key: 'Escape' });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('Yes')).toBeNull();
  });
});
