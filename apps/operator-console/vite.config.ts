import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const rootDir = path.join(__dirname, '../..');
  const env = loadEnv(mode, rootDir, '');
  const adminApiKey = env.ADMIN_API_KEY?.trim() ?? '';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              if (adminApiKey) {
                proxyReq.setHeader('x-admin-api-key', adminApiKey);
              }
            });
          },
        },
      },
    },
  };
});
