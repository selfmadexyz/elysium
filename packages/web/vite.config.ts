import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(mode === 'test' ? [] : [nitro({ config: { externals: { external: ['pg'] } } })]),
    viteReact(),
  ],
  resolve: {
    alias: {
      '@backend': fileURLToPath(new URL('../backend/src', import.meta.url)),
      '@frontend': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    external: ['pg'],
  },
}));
