import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$engine': path.resolve('./src/engine'),
      '$ui': path.resolve('./src/ui'),
      '$stores': path.resolve('./src/stores'),
      '$data': path.resolve('./src/data')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
