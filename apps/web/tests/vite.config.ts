import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    envDir: path.resolve(__dirname, 'fixtures'),
    resolve: { alias: { '@': path.resolve(__dirname, '../src') } },
    server: { host: '127.0.0.1', port: 5186, strictPort: true },
});
