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
  build: {
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minify with esbuild for faster builds
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Disable sourcemaps in production for smaller files
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'esnext',
  },
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    // Enable CORS
    cors: true,
    // Warm up frequently used files
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/Index.tsx',
      ]
    },
    // Vite dev server natively handles SPA routing — all 404s fall back to index.html
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: false,
    // SPA fallback: all unknown routes serve index.html so React Router works on refresh
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
    ],
    // Exclude large dependencies from pre-bundling
    exclude: ['leaflet', 'react-leaflet'],
  },
})
