import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'phone-controller': resolve(__dirname, 'phone-controller.html'),
      },
    },
  },
});
