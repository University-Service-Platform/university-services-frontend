import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Optional: send /api to a local API Gateway during development (same origin, no CORS).
  // Set VITE_DEV_API_PROXY=http://localhost:8000 and VITE_API_BASE_URL=/api/v1 in .env.local.
  const apiProxy = env.VITE_DEV_API_PROXY

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: apiProxy ? { proxy: { '/api': { target: apiProxy, changeOrigin: true } } } : undefined,
  }
})
