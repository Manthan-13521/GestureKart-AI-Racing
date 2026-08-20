import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // P7.3: bounded parallelism — the default (all cores) starved the
    // rAF/setTimeout timing in flow.test.ts under full-suite load and
    // produced intermittent single-test flakes (same class of fix as
    // Playwright's `workers: 1` in P7.1).
    maxWorkers: 4,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/ui/**'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
