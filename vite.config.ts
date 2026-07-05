import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [svelte(), tailwindcss()],
    optimizeDeps: {
      exclude: ['lucide-svelte']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf')) return 'jspdf';
              if (id.includes('html2canvas')) return 'html2canvas';
              if (id.includes('lucide-svelte')) return 'lucide-svelte';
              if (id.includes('svelte')) return 'svelte';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
