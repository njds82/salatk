// Supabase Client Initialization (Global Scope)
// Credentials are loaded from config.js (not committed to git)
const supabaseUrl = window.CONFIG ? window.CONFIG.SUPABASE_URL : null;
const supabaseKey = window.CONFIG ? window.CONFIG.SUPABASE_ANON_KEY : null;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase Config Missing! Make sure js/config.js is loaded and contains SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Check for global supabase object (handle both lowercase and capitalized variants)
const SupabaseFactory = window.supabase || window.Supabase;

if (SupabaseFactory && SupabaseFactory.createClient) {
    try {
        window.supabaseClient = SupabaseFactory.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
        console.log('Supabase Client Initialized Successfully');
    } catch (err) {
        console.error('Failed to initialize Supabase Client:', err);
    }
} else {
    console.error('Supabase SDK not loaded. global "supabase" or "Supabase" not found.');
}

// Fallback to prevent "window.supabaseClient is undefined" crash
if (!window.supabaseClient) {
    console.warn('Using dummy Supabase client due to initialization failure');
    window.supabaseClient = {
        auth: {
            signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            signUp: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            signOut: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase Client not initialized' } }),
            getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase Client not initialized' } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
                    maybeSingle: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
                    order: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
                })
            }),
            upsert: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
            insert: () => Promise.resolve({ error: { message: 'Supabase Client not initialized' } }),
        })
    };
}
