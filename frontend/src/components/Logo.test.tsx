import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import Logo from './Logo';

afterEach(cleanup);

describe('Logo', () => {
  it('shows the Lotz Solutions wordmark next to the ring', () => {
    const { container } = render(<Logo />);
    expect(container.textContent).toBe('LotzSolutions');
    expect(container.querySelectorAll('svg circle')).toHaveLength(3);
  });
});
