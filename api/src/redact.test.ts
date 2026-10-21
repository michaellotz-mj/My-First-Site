import { describe, expect, it } from 'vitest';
import { redactSecrets } from './redact';

describe('redactSecrets', () => {
  it("redacts the Neon driver's invalid-URL message", () => {
    const msg =
      'Database connection string provided to neon() is not a valid URL (connection string: postgresql://u:pw@h…/db)';
    expect(redactSecrets(msg)).toBe(
      'Database connection string provided to neon() is not a valid URL (connection string: [redacted])',
    );
  });
  it('redacts bare connection strings', () =>
    expect(redactSecrets('failed for postgres://u:pw@host/db today')).toBe('failed for [redacted] today'));
  it('leaves ordinary messages alone', () =>
    expect(redactSecrets('relation "activities" does not exist')).toBe('relation "activities" does not exist'));
});
