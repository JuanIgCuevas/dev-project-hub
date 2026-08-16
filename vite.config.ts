import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) return 'forms'
          return 'vendor'
        },
      },
    },
  },
})
