import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { repoPath } from '../helpers/paths.js';

describe('verify_hijri.js', () => {
    it('runs standalone verification script and prints both languages', () => {
        let output = '';

        try {
            output = execFileSync(process.execPath, [repoPath('verify_hijri.js')], {
                encoding: 'utf8'
            });
        } catch (error) {
            if (error?.code !== 'EPERM') throw error;

            const source = fs.readFileSync(repoPath('verify_hijri.js'), 'utf8');
            const logs = [];
            const context = {
                console: {
                    log: (...args) => logs.push(args.join(' '))
                },
                Date,
                Math
            };
            vm.createContext(context);
            vm.runInContext(source, context, { filename: repoPath('verify_hijri.js') });
            output = logs.join('\n');
        }

        expect(output).toContain('Gregorian: 2026-01-01');
        expect(output).toContain('Arabic:');
        expect(output).toContain('English:');
    });
});
