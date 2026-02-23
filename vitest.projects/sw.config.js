import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig, defineProject } from 'vitest/config';
import base from './base.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export default mergeConfig(base, defineProject({
    test: {
        name: 'sw',
        include: [path.resolve(ROOT, 'tests/sw/**/*.spec.js')],
        environment: 'node'
    }
}));
