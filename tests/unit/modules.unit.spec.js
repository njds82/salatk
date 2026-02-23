import { pathToFileURL } from 'node:url';
import { repoPath } from '../helpers/paths.js';
import { createBootstrappedWindow } from '../helpers/bootstrap.js';

async function importFresh(relativePath) {
    const url = pathToFileURL(repoPath(relativePath)).href;
    return import(`${url}?t=${Date.now()}-${Math.random()}`);
}

describe('ESM modules', () => {
    it('loads question bank module and returns challenge sets', async () => {
        const mod = await importFresh('js/data/questions.js');
        const ar = mod.getChallenges('ar');
        const en = mod.getChallenges('en');

        expect(Array.isArray(ar)).toBe(true);
        expect(Array.isArray(en)).toBe(true);
        expect(ar.length).toBeGreaterThan(0);
        expect(en.length).toBeGreaterThan(0);
    });

    it('loads challenge page module and exposes renderer', async () => {
        const { window, cleanup } = createBootstrappedWindow();

        // Ensure required globals exist before module evaluation.
        window.PointsService = {
            addPoints: async () => true
        };
        globalThis.t = window.t;

        await importFresh('js/pages/challenge.js');

        expect(typeof window.renderChallengePage).toBe('function');
        const html = await window.renderChallengePage(true);
        expect(html).toContain('challenge-page');

        cleanup();
    });
});
