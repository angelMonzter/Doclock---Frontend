import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

//code mode usuarios: proxy local para login/usuarios sin cambiar CORS ni el backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_');
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://127.0.0.1:4000',
      changeOrigin: true,
    },
  };
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { proxy },
    preview: { proxy },
  };
});
