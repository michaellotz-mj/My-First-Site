import { defineConfig } from 'vitest/config';

// Unit tests only — pure logic, no network.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
