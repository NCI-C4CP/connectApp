import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    isolate: true,
    setupFiles: ['tests/testSetup.js'],
    include: ['tests/**/*.spec.js'],
    exclude: [],
    clearMocks: true,
    restoreMocks: true,
  },
});
