import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// /api 요청을 백엔드(8080)로 프록시 -> CORS/쿠키 문제 없이 개발 가능
// 백엔드를 다른 포트에 띄웠다면 API_TARGET 환경변수로 바꾼다 (예: API_TARGET=http://localhost:8081 npm run dev)
export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, '.', 'API_').API_TARGET || 'http://localhost:8080';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
