import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix for __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Simplified build configuration to avoid React context issues
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React and React-DOM together to prevent context issues
          'react-vendor': ['react', 'react-dom'],
          // Group React ecosystem libraries
          'react-libs': [
            'react-router-dom', 
            '@tanstack/react-query',
            'react-hook-form',
            'react-i18next'
          ],
          // UI libraries that depend on React context
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          // Large standalone libraries
          'animation-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
          'map-vendor': ['leaflet', 'react-leaflet']
        },
        // Simplified file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification (faster and no additional dependencies)
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Disable sourcemaps in production for smaller files
    sourcemap: false,
    // Target ES2020 for better browser compatibility
    target: 'es2020',
    // Ensure proper module format
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    // Enable CORS
    cors: true,
    // Warm up frequently used files for faster dev startup
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/Index.tsx',
      ]
    },
    // Vite dev server natively handles SPA routing
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: false,
    // SPA fallback for preview mode
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'leaflet',
      'react-leaflet',
    ],
  },
  // Base path for deployment (change if deploying to subdirectory)
  base: '/',
})
