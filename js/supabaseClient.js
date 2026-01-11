// Supabase Client Initialization (Global Scope)
// Credentials are loaded from config.js (not committed to git)
const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;

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
