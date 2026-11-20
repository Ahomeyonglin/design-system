import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      fs: {
        // 允许读取仓库根部的 CHANGELOG.md 与 packages/ui/registry.json
        allow: ['../..'],
      },
    },
  };
});
