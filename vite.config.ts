import { execSync } from 'node:child_process';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
// The version shown in Settings: the date and short hash of the last
// commit, so every deploy gets a new one without bumping anything.
const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};
const version =
  [git('log -1 --format=%cs'), git('rev-parse --short HEAD')]
    .filter(Boolean)
    .join(' · ') || 'dev';

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  base: '/des-sudoku/',
  plugins: [
    react(),
    // Installable from the browser menu, and works offline once loaded.
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      // Precache theme backgrounds too, so they work offline.
      workbox: { globPatterns: ['**/*.{js,wasm,css,html,webp}'] },
      manifest: {
        // A fixed id of its own. Not 'des-<name>' like the newer games: this
        // is the id phones already gave it (its start_url) before it had one,
        // so an installed copy stays the same app and keeps updating.
        id: '/des-sudoku/',
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
