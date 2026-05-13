import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { HttpsProxyAgent } from 'https-proxy-agent';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {

            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },

            '/tmdb-proxy': {
                target: 'https://image.tmdb.org',
                changeOrigin: true,

                agent: new HttpsProxyAgent('http://127.0.0.1:7897'),
                rewrite: (path) => path.replace(/^\/tmdb-proxy/, '')
            }
        }
    }
});