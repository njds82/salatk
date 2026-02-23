import fs from 'node:fs';
import path from 'node:path';
import { ALL_SOURCE_FILES } from '../helpers/source-manifest.js';
import { REPO_ROOT } from '../helpers/paths.js';

function listFilesRecursively(relativeDir) {
    const absolute = path.resolve(REPO_ROOT, relativeDir);
    const output = [];

    function walk(dir, base) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const absPath = path.join(dir, entry.name);
            const relPath = path.join(base, entry.name).replaceAll('\\', '/');

            if (entry.isDirectory()) {
                walk(absPath, relPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                output.push(relPath);
            }
        }
    }

    walk(absolute, relativeDir);
    return output;
}

describe('Meta direct-spec coverage', () => {
    it('keeps source manifest in sync with repository files', () => {
        const discovered = [
            ...listFilesRecursively('js'),
            ...listFilesRecursively('components'),
            'sw.js',
            'verify_hijri.js'
        ].sort();

        const manifest = [...ALL_SOURCE_FILES].sort();

        expect(manifest).toEqual(discovered);
    });
});
