import { execFileSync } from 'node:child_process';
import { repoPath } from '../helpers/paths.js';

describe('verify_hijri.js', () => {
    it('runs standalone verification script and prints both languages', () => {
        const output = execFileSync('node', [repoPath('verify_hijri.js')], {
            encoding: 'utf8'
        });

        expect(output).toContain('Gregorian: 2026-01-01');
        expect(output).toContain('Arabic:');
        expect(output).toContain('English:');
    });
});
