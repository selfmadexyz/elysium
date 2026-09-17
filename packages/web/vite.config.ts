import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: 'src' }),
    viteReact(),
    nitro({
      ...(process.env.VERCEL ? {} : { preset: 'bun' }),
      routeRules: {
        '/**': {
          headers: {
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        },
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@frontend': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    noExternal: ['@noble/ciphers'],
  },
});
