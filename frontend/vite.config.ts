import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 개발 중에는 /api를 로컬 백엔드(uvicorn 8000번)로 넘긴다
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  // 글꼴 조각을 data: 주소로 끼워 넣지 않는다 (보안 정책 font-src 'self'와 맞춤)
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false, assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
