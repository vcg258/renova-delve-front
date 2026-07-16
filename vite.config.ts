import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api 요청을 백엔드(8080)로 프록시 -> CORS/쿠키 문제 없이 개발 가능
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
