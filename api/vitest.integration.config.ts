import { defineConfig } from 'vitest/config';

// Integration tests — require `wrangler dev` running on localhost:8787 with a real DATABASE_URL.
export default defineConfig({
  test: { include: ['integration.test.ts'], testTimeout: 20000, hookTimeout: 30000 },
});
