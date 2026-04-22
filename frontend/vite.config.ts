import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    // Vite dev server natively handles SPA routing — all 404s fall back to index.html
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: false,
    // SPA fallback: all unknown routes serve index.html so React Router works on refresh
  },
})