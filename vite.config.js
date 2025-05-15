import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Optional: specify a port
    open: true, // Optional: open browser on start
    proxy: {
      // 将所有API请求代理到本地7001端口
      '/api/v1': {
        target: 'http://127.0.0.1:7001',
        changeOrigin: true,
      }
    }
  }
})