import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, cpSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  root: './src',
  publicDir: './public',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
});
