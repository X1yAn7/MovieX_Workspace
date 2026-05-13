import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Vite Configuration
 * 包含 React 插件支持、Tailwind CSS v4 构建支持以及开发环境的代理配置
 */
export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    server: {
        proxy: {
            /* 代理后端 API 请求 */
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            /* 代理 TMDB 图片请求，并配置本地代理客户端 */
            '/tmdb-proxy': {
                target: 'https://image.tmdb.org',
                changeOrigin: true,
                agent: new HttpsProxyAgent('http://127.0.0.1:7897'),
                rewrite: (path) => path.replace(/^\/tmdb-proxy/, '')
            }
        }
    }
});