import { createLegacyDom, installWindowGlobals } from './legacy-env.js';
import { mountBaseDom } from './dom-fixture.js';
import { installBrowserMocks } from './mock-browser.js';
import { createMockSupabaseClient } from './mock-supabase.js';
import { loadLegacyScripts } from './load-legacy-script.js';

const CORE_SCRIPTS = [
    'js/config.example.js',
    'js/i18n.js',
    'js/date-utils.js'
];

export function createBootstrappedWindow(options = {}) {
    const { dom, window, close } = createLegacyDom({
        html: options.html,
        url: options.url
    });

    mountBaseDom(window);
    installBrowserMocks(window, options.browser || {});

    const restoreGlobals = installWindowGlobals(window);

    window.__SALATK_TEST__ = true;
    window.supabaseClient = options.supabaseClient || createMockSupabaseClient(options.supabase || {});

    window.withTimeout = async function withTimeout(promise, timeoutMs, timeoutValue = null) {
        return Promise.race([
            promise,
            new Promise((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
        ]);
    };

    const authSession = options.session || {
        user: {
            id: 'test-user-id',
            email: 'test@salatk.local'
        }
    };

    window.AuthManager = options.authManager || {
        _session: authSession,
        async getSession() {
            return this._session;
        },
        async getCurrentUser() {
            return authSession.user;
        },
        async getProfile() {
            return {
                id: authSession.user.id,
                username: 'tester',
                full_name: 'Test User',
                referral_code: 'ABC123',
                is_public: true
            };
        },
        async signOut() {
            return { error: null };
        },
        async signIn() {
            return { error: null, data: { session: authSession } };
        },
        async signUp() {
            return { error: null, data: { session: authSession } };
        },
        async updateProfile() {
            return { success: true };
        },
        setSession(session) {
            this._session = session;
        }
    };

    const shouldLoadCoreScripts = options.loadCoreScripts !== false;
    if (shouldLoadCoreScripts) {
        loadLegacyScripts(window, CORE_SCRIPTS);
    }

    if (options.scripts && options.scripts.length > 0) {
        loadLegacyScripts(window, options.scripts);
    }

    function cleanup() {
        restoreGlobals();
        close();
    }

    return {
        dom,
        window,
        cleanup
    };
}
