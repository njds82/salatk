// Configuration file - DO NOT COMMIT THIS FILE
// Copy config.example.js and rename to config.js, then add your keys.
// For tests, you can override via window.__SALATK_CONFIG__ before this file loads.

const __SALATK_DEFAULT_CONFIG__ = {
    SUPABASE_URL: 'https://xdvnweeorbuqmrgbtxuu.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_eHXON1ifMqmCGCqBIUd01A_WTaVq1Qu'
};

window.CONFIG = {
    ...__SALATK_DEFAULT_CONFIG__,
    ...(window.__SALATK_CONFIG__ || {})
};
