import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Optional: specify a port
    open: true    // Optional: open browser on start
  }
})
