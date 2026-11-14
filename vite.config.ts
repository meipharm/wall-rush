import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base 使用相對路徑，建置後可放在任何靜態主機子目錄
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
