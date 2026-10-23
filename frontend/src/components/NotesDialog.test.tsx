import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NotesDialog from './NotesDialog';

afterEach(cleanup);

const setup = (notes = '') => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<NotesDialog title="Screening V2 config" notes={notes} onSave={onSave} onClose={onClose} />);
  return { onSave, onClose, box: screen.getByLabelText('Notes for Screening V2 config') as HTMLTextAreaElement };
};

describe('NotesDialog', () => {
  it('shows the existing notes and saves edits', () => {
    const { onSave, onClose, box } = setup('Call Sam');
    expect(box.value).toBe('Call Sam');
    expect(document.activeElement).toBe(box);
    fireEvent.change(box, { target: { value: 'Call Sam\nAsk about v2' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('Call Sam\nAsk about v2');
    expect(onClose).toHaveBeenCalled();
  });

  it('Save is disabled until something changes', () => {
    setup('Call Sam');
    expect((screen.getByText('Save') as HTMLButtonElement).disabled).toBe(true);
  });

  it('Cancel discards changes', () => {
    const { onSave, onClose, box } = setup('Call Sam');
    fireEvent.change(box, { target: { value: 'changed' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Ctrl+Enter saves', () => {
    const { onSave, box } = setup();
    fireEvent.change(box, { target: { value: 'Quick note' } });
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith('Quick note');
  });
});
