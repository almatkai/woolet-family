import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const envDir = path.resolve(__dirname, '../../');
    const environmentMode = mode === 'production' ? 'prod' : 'dev';
    const fileEnv = loadEnv(environmentMode, envDir, '');
    const env = { ...fileEnv, ...process.env };
    const clientEnv = Object.fromEntries(
        Object.entries(env)
            .filter(([key]) => key.startsWith('VITE_'))
            .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
    );
    const port = parseInt(env.WEB_PORT || '3000');
    const apiPort = env.PORT || '3006';

    return {
        plugins: [
            react(),
        ],
        envDir,
        define: clientEnv,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        optimizeDeps: {
            include: ['react-grid-layout'],
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('recharts')) return 'recharts';
                            if (id.includes('lucide-react')) return 'lucide';
                            if (id.includes('framer-motion') || id.includes('motion')) return 'motion';
                            if (id.includes('@clerk')) return 'clerk';
                            if (id.includes('react-grid-layout')) return 'rgl';
                            if (id.includes('react-day-picker')) return 'day-picker';
                            if (id.includes('date-fns')) return 'date-fns';
                            return 'vendor';
                        }
                    },
                },
            },
            chunkSizeWarningLimit: 1000,
        },
        server: {
            port: port,
            proxy: {
                '/api/demo': {
                    target: `http://localhost:${apiPort}`,
                    rewrite: url => url.replace(/^\/api/, ''),
                    changeOrigin: false,
                },
                '/trpc': {
                    target: `http://localhost:${apiPort}`,
                    changeOrigin: true,
                },
                '/ai': {
                    target: `http://localhost:${apiPort}`,
                    changeOrigin: true,
                },
                '/billing': {
                    target: `http://localhost:${apiPort}`,
                    changeOrigin: true,
                },
            },
        },
    };
});
