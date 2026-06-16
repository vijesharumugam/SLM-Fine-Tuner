import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawUrl = env.VITE_API_BASE_URL || 'http://localhost:8000';
  const targetUrl = rawUrl.replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/datasets': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        },
        '/training': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        },
        '/models': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        },
        '/chat': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        },
        '/system': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        }
      }
    }
  }
})
