import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './src',
  publicDir: false, // Désactivé car on utilise le plugin pour copier
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
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'css', dest: '.' },
        { src: 'js', dest: '.' },
        { src: 'libs', dest: '.' },
        { src: 'donnees', dest: '.' },
        { src: 'assets', dest: '.' },
        { src: 'enquete.json', dest: '.' },
        { src: 'manifest.json', dest: '.' }
      ]
    })
  ]
});
