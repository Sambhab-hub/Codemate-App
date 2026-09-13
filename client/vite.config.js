import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // Proxy: any request starting with /api is forwarded to Express.
    // This means the React app calls /api/health (not http://localhost:5000/api/health).
    // WHY? Two benefits:
    //  1. No CORS issues during development (same-origin request)
    //  2. We don't hardcode the backend URL in the frontend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
