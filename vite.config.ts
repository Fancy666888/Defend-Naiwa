import {defineConfig} from 'vite';

export default defineConfig({
  // This game has a single entry page. Relative URLs work at / and /repo/.
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {phaser: ['phaser']}
      }
    },
    // Phaser includes its renderers and systems in one vendor bundle.
    chunkSizeWarningLimit: 1300
  }
});
