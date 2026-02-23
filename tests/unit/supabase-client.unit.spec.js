import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';

describe('supabaseClient bootstrap', () => {
    it('uses runtime override config when provided', () => {
        const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });

        window.__SALATK_CONFIG__ = {
            SUPABASE_URL: 'http://127.0.0.1:54321',
            SUPABASE_ANON_KEY: 'test-anon-key'
        };

        const createClientSpy = vi.fn(() => ({ auth: {}, from: () => ({}) }));
        window.supabase = { createClient: createClientSpy };

        loadLegacyScripts(window, ['js/config.example.js', 'js/supabaseClient.js']);

        expect(window.CONFIG.SUPABASE_URL).toBe('http://127.0.0.1:54321');
        expect(createClientSpy).toHaveBeenCalledWith(
            'http://127.0.0.1:54321',
            'test-anon-key',
            expect.any(Object)
        );

        cleanup();
    });
});
