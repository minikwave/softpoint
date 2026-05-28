import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(dir, '../..'), '');
  const adminKey = env.ADMIN_API_KEY ?? env.VITE_ADMIN_API_KEY ?? '';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (adminKey) {
                proxyReq.setHeader('x-admin-api-key', adminKey);
              }
            });
          },
        },
      },
    },
  };
});
