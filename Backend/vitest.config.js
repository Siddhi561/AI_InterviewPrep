// Backend/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // gives you describe/it/expect without importing
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    clearMocks: true,        // resets mock state between each test automatically
    testTimeout: 10000,
  },
});
