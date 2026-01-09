// ========================================
// Settings Service
// ========================================

const SettingsService = {
    _cache: null,

    // Get all settings as an object
    async getSettings() {
        if (this._cache) return this._cache;

        if (!window.supabaseClient) {
            this._cache = this.getDefaultSettings();
            return this._cache;
        }

        const session = await window.AuthManager.getSession();
        if (!session) {
            this._cache = this.getDefaultSettings();
            return this._cache;
        }

        try {
            const { data, error } = await withTimeout(
                window.supabaseClient
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle(),
                3000,
                { data: null, error: 'timeout' }
            );

            if (data) {
                // Merge strategies:
                // 1. Theme/Language: LocalStorage is usually the "latest" truth if the user just toggled it.
                // However, if we are loading clean on a new device, Cloud is truth.
                // Our set() updates both. 
                // To avoid "flash of wrong theme" on slow network, we already loaded LS in app.js.
                // Here we just update the cache.

                this._cache = {
                    language: data.language || localStorage.getItem('salatk_lang') || 'ar',
                    theme: data.theme || localStorage.getItem('salatk_theme') || 'light',
                    calculationMethod: data.calculation_method || 'UmmAlQura',
                    madhab: data.madhab || 'Shafi',
                    lastVisit: data.last_visit || new Date().toISOString().split('T')[0],
                    initialized: data.initialized_at || Date.now()
                };
                return this._cache;
            }

        } catch (e) {
            console.error('SettingsService: Failed to fetch cloud settings', e);
        }

        this._cache = this.getDefaultSettings();
        return this._cache;
    },

    getDefaultSettings() {
        return {
            language: localStorage.getItem('salatk_lang') || 'ar',
            theme: localStorage.getItem('salatk_theme') || 'light',
            calculationMethod: 'UmmAlQura',
            madhab: 'Shafi',
            lastVisit: new Date().toISOString().split('T')[0],
            initialized: Date.now()
        };
    },

    // Get single setting
    async get(key, defaultValue) {
        const settings = await this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    },

    // Set setting
    async set(key, value) {
        // 1. Update cache immediately (Optimistic)
        if (!this._cache) this._cache = this.getDefaultSettings(); // Ensure cache exists
        this._cache[key] = value;

        // 2. Persist to LocalStorage IMMEDIATELY (Synchronous) to prevent race conditions on reload
        localStorage.setItem(`salatk_${key}`, value);

        // 3. Apply side effects (DOM, etc)
        this.applySettings({ [key]: value });

        if (!window.supabaseClient) return;

        const session = await window.AuthManager.getSession();
        if (!session) return;

        // 4. Background Sync to Cloud
        const updates = { user_id: session.user.id };
        const fieldMap = {
            'language': 'language',
            'theme': 'theme',
            'calculationMethod': 'calculation_method',
            'madhab': 'madhab',
            'lastVisit': 'last_visit'
        };

        if (fieldMap[key]) {
            updates[fieldMap[key]] = value;
            try {
                // Determine update strategy based on importance
                // Theme/Lang: fire and forget mostly, but we await to be safe against quick reloads
                const timeout = (key === 'theme' || key === 'language') ? 2000 : 5000;

                await withTimeout(
                    window.supabaseClient.from('user_settings').upsert(updates),
                    timeout
                );

                // If calculation/madhab changed, clear prayer cache
                if (key === 'calculationMethod' || key === 'madhab') {
                    if (window.PrayerManager) window.PrayerManager.clearCache();
                }
            } catch (e) {
                console.error('SettingsService: Failed to save to cloud', e);
            }
        }
    },


    async init() {
        const settings = await this.getSettings();
        this.applySettings(settings);
    },

    // Apply settings to DOM and cache
    applySettings(settings) {
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
            localStorage.setItem('salatk_theme', settings.theme);

            const sunIcon = document.querySelector('.sun-icon');
            const moonIcon = document.querySelector('.moon-icon');

            const darkThemes = ['dark', 'midnight', 'nightsky', 'darkstars', 'metalknight'];
            const isDark = darkThemes.includes(settings.theme);

            if (sunIcon && moonIcon) {
                if (isDark) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        }

        if (settings.language) {
            document.documentElement.lang = settings.language;
            document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
            localStorage.setItem('salatk_lang', settings.language);
        }
    }
};

window.SettingsService = SettingsService;
