import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import UrgencyBadge from './UrgencyBadge';

afterEach(cleanup);

describe('UrgencyBadge', () => {
  it('shows the number and lets you pick another urgency', () => {
    const onChange = vi.fn();
    render(<UrgencyBadge urgency={2} name="Screening" onChange={onChange} />);
    const select = screen.getByLabelText('Urgency for Screening') as HTMLSelectElement;
    expect(select.value).toBe('2');
    expect([...select.options].map((o) => o.textContent)).toEqual([
      '1 – Do first',
      '2 – Important, not urgent',
      '3 – Can wait',
    ]);
    fireEvent.change(select, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('read-only badge has no picker', () => {
    render(<UrgencyBadge urgency={3} name="Gym" />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('Urgency 3')).toBeTruthy();
  });
});
