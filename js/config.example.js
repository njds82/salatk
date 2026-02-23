// Configuration file example
// Copy this file to config.js and add your actual Supabase credentials.
// For tests, you can override via window.__SALATK_CONFIG__ before this file loads.

const __SALATK_DEFAULT_CONFIG__ = {
    SUPABASE_URL: 'https://your-project-ref.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here'
};

window.CONFIG = {
    ...__SALATK_DEFAULT_CONFIG__,
    ...(window.__SALATK_CONFIG__ || {})
};
