import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
            manifest: {
                name: 'Kinetic — Train with intent',
                short_name: 'Kinetic',
                description: 'Local-first strength, cardio, recovery and coaching for Myer and Yusma.',
                theme_color: '#0a0c10',
                background_color: '#0a0c10',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                categories: ['fitness', 'health', 'lifestyle'],
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                navigateFallback: '/index.html',
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                runtimeCaching: []
            },
            devOptions: { enabled: true }
        })
    ],
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true
    }
});
