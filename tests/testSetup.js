import { afterEach, beforeEach, vi } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers.js';

// Ensure a baseline browser-like environment exists before any suite-level imports.
setupTestEnvironment();

beforeEach(() => {
  setupTestEnvironment();
});

afterEach(() => {
  teardownTestEnvironment();
  delete globalThis.firebase;
  delete globalThis.alert;
  vi.restoreAllMocks();
});
