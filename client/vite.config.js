// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['@mantine/core', '@mantine/dates', '@mantine/hooks', 'dayjs', 'axios'],
      exclude: ['pdfjs-dist'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('country-state-city')) {
                return 'vendor-country-data';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('@mantine') || id.includes('mantine-datatable')) {
                return 'vendor-mantine';
              }
              if (id.includes('@tabler/icons') || id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('date-holidays')) {
                return 'vendor-holidays';
              }
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
