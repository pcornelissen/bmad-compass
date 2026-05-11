import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    // chokidar/FSEvents on macOS gets unreliable when multiple watcher tests
    // run in parallel forks. Running test files sequentially keeps the suite green.
    fileParallelism: false,
  },
});
