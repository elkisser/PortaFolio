import { defineConfig } from 'vitest/config';

// Tests unitarios y property-based (fast-check) viven en `tests/`.
// Los tests E2E (Playwright) viven en `e2e/` y se excluyen de Vitest.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e', '.astro'],
    environment: 'node',
  },
});
