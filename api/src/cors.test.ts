import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './index';

describe('isAllowedOrigin', () => {
  it('allows localhost on any port', () => {
    expect(isAllowedOrigin('http://localhost:5174', '')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:8787', undefined)).toBe(true);
  });
  it('allows configured origins only', () => {
    const allowed = 'https://todo.example.workers.dev, https://other.example';
    expect(isAllowedOrigin('https://todo.example.workers.dev', allowed)).toBe(true);
    expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false);
  });
  it('rejects missing and look-alike origins', () => {
    expect(isAllowedOrigin(null, '')).toBe(false);
    expect(isAllowedOrigin('http://localhost.evil.com', '')).toBe(false);
  });
});
