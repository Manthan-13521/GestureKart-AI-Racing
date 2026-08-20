import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // three.js is isolated into its own vendor chunk; 528 kB minified is the
    // library itself, not app code, so raise the warning threshold past it.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'phone-controller': resolve(__dirname, 'phone-controller.html'),
      },
      output: {
        manualChunks: {
          three: ['three'],
          qrcode: ['qrcode-generator'],
        },
      },
    },
  },
});
