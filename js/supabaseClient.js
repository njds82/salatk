// Supabase Client Initialization (Global Scope)
const IS_TEST_MODE = !!window.__SALATK_TEST__;

function debugLog(...args) {
    if (!IS_TEST_MODE) {
        console.log(...args);
    }
}

function debugWarn(...args) {
    if (!IS_TEST_MODE) {
        console.warn(...args);
    }
}

function debugError(...args) {
    // Keep hard errors visible in all modes.
    console.error(...args);
}

function createDummyQuery() {
    const result = {
        data: null,
        error: { message: 'Supabase Client not initialized' }
    };

    const query = {
        select: () => query,
        eq: () => query,
        neq: () => query,
        gt: () => query,
        gte: () => query,
        lt: () => query,
        lte: () => query,
        in: () => query,
        is: () => query,
        order: () => query,
        limit: () => query,
        single: () => Promise.resolve(result),
        maybeSingle: () => Promise.resolve(result),
        insert: () => query,
        update: () => query,
        upsert: () => query,
        delete: () => query,
        then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
        catch: (onRejected) => Promise.resolve(result).catch(onRejected),
        finally: (onFinally) => Promise.resolve(result).finally(onFinally)
    };

    return query;
}

debugLog('supabaseClient.js loading...');
debugLog('window.CONFIG check:', window.CONFIG);
debugLog('window.supabase check:', !!window.supabase, 'window.Supabase check:', !!window.Supabase);

// Allow test/runtime overrides regardless of load order.
const runtimeConfig = {
    ...(window.CONFIG || {}),
    ...(window.__SALATK_CONFIG__ || {})
};
window.CONFIG = runtimeConfig;

const supabaseUrl = runtimeConfig.SUPABASE_URL || null;
const supabaseKey = runtimeConfig.SUPABASE_ANON_KEY || null;

if (!supabaseUrl || !supabaseKey) {
    debugError('Supabase Config Missing! Make sure js/config.js is loaded and contains SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Check for global supabase object (handle both lowercase and capitalized variants)
const SupabaseFactory = window.supabase || window.Supabase;

if (SupabaseFactory && SupabaseFactory.createClient && supabaseUrl && supabaseKey) {
    try {
        window.supabaseClient = SupabaseFactory.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
        debugLog('Supabase Client Initialized Successfully');
    } catch (err) {
        debugError('Failed to initialize Supabase Client:', err);
    }
} else if (!SupabaseFactory || !SupabaseFactory.createClient) {
    debugError('Supabase SDK not loaded. global "supabase" or "Supabase" not found.');
}

// Fallback to prevent "window.supabaseClient is undefined" crash
if (!window.supabaseClient) {
    debugWarn('Using dummy Supabase client due to initialization failure');

    window.supabaseClient = {
        auth: {
            signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            signUp: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            signOut: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase Client not initialized' } }),
            getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase Client not initialized' } }),
            updateUser: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            session: () => null
        },
        channel: () => ({
            on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
            subscribe: () => ({ unsubscribe: () => { } })
        }),
        from: () => createDummyQuery()
    };
}
