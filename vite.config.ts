import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/des-sudoku/',
  plugins: [
    react(),
    // Installable from the browser menu, and works offline once loaded.
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Sudoku',
        short_name: 'Sudoku',
        description: 'Sudoku puzzles that work offline',
        theme_color: '#3056d3',
        background_color: '#f4f5f7',
        display: 'standalone',
      },
    }),
  ],
});
