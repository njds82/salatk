import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    './vitest.projects/unit.config.js',
    './vitest.projects/dom.config.js',
    './vitest.projects/sw.config.js',
    './vitest.projects/integration.config.js'
]);
