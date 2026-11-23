import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Guide from './Guide';

afterEach(cleanup);

describe('Guide', () => {
  it('has a contents list, every section, and links back to the list', () => {
    render(<Guide />);
    const sections = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(sections).toContain('1. How your list is organised');
    expect(sections).toContain('6. Planning your day (the Today tab)');
    const contents = screen.getByRole('navigation', { name: 'Guide contents' });
    expect(contents.querySelectorAll('button')).toHaveLength(sections.length);
    expect(screen.getAllByRole('link', { name: /Back to your list/ }).length).toBeGreaterThan(0);
  });

  it('marks the header Guide link as the current page', () => {
    render(<Guide />);
    expect(screen.getByRole('link', { name: 'Guide' }).getAttribute('aria-current')).toBe('page');
  });
});
