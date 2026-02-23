import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export default defineConfig({
    root: ROOT,
    test: {
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
        isolate: true,
        setupFiles: [path.resolve(ROOT, 'tests/helpers/global-setup.js')],
        coverage: {
            provider: 'v8',
            all: true,
            include: [
                'js/services/**/*.js'
            ],
            exclude: [
                'tests/**',
                'assets/**'
            ],
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                statements: 85,
                branches: 85,
                functions: 85,
                lines: 85
            }
        }
    },
});
