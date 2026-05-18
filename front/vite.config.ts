import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Vite Configuration
 * 包含 React 插件支持、Tailwind CSS v4 构建支持以及开发环境的代理配置
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const tmdbProxyUrl = env.VITE_HTTPS_PROXY || env.HTTPS_PROXY || '';

    return {
        plugins: [
            react(),
            tailwindcss()
        ],
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                },
                '/tmdb-proxy': {
                    target: 'https://image.tmdb.org',
                    changeOrigin: true,
                    ...(tmdbProxyUrl ? { agent: new HttpsProxyAgent(tmdbProxyUrl) } : {}),
                    rewrite: (path) => path.replace(/^\/tmdb-proxy/, '')
                }
            }
        }
    };
});