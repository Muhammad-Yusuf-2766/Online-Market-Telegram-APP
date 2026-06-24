import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __GIT_SHA__: JSON.stringify(process.env.GIT_SHA ?? 'dev'),
  },
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/_ansor-api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ansor-api/, '') || '/',
        ws: true,
      },
    },
  },
})
