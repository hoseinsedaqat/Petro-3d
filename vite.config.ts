import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: { host: '0.0.0.0', allowedHosts: true },
  build: {
    target: 'es2020',
    // Three.js ships one shared renderer bundle (~177 KB gzip) by design.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/node_modules/three/')) return 'three-core';
          if (id.includes('/node_modules/@react-three/fiber/')) return 'r3f-vendor';
          if (id.includes('/node_modules/@react-three/drei/') || id.includes('/node_modules/three-stdlib/')) return 'drei-vendor';
          if (id.includes('/@react-three/')) return 'scene-vendor';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react-vendor';
          if (id.includes('/framer-motion/') || id.includes('/lucide-react/') || id.includes('/zustand/')) return 'ui-vendor';
        },
      },
    },
  },
});
