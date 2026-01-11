// Supabase Client Initialization (Global Scope)
// Credentials are loaded from config.js (not committed to git)
const supabaseUrl = window.CONFIG ? window.CONFIG.SUPABASE_URL : null;
const supabaseKey = window.CONFIG ? window.CONFIG.SUPABASE_ANON_KEY : null;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase Config Missing! Make sure js/config.js is loaded and contains SUPABASE_URL and SUPABASE_ANON_KEY');
}

// supabase is provided by the CDN script in index.html
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    });
} else {
    console.error('Supabase SDK not loaded');
}
