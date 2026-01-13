import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.git', 'e2e'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                'vite.config.ts',
                'vitest.config.ts',
                '**/*.config.ts',
                '**/*.config.js',
                'dist/',
                'e2e/',
                '**/index.ts', // Barrel exports
            ],
            include: [
                'lib/**/*.ts',
                'hooks/**/*.ts',
                'components/**/*.{ts,tsx}',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 75,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
