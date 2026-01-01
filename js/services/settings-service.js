// ========================================
// Settings Service
// ========================================

const SettingsService = {
    // Get all settings as an object
    async getSettings() {
        if (!window.supabaseClient) return this.getDefaultSettings();

        const session = await window.AuthManager.getSession();
        if (!session) return this.getDefaultSettings();

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
                return {
                    language: data.language || 'ar',
                    theme: data.theme || 'light',
                    calculationMethod: data.calculation_method || 'UmmAlQura',
                    madhab: data.madhab || 'Shafi',
                    lastVisit: data.last_visit || new Date().toISOString().split('T')[0],
                    initialized: data.initialized_at || Date.now()
                };
            }
        } catch (e) {
            console.error('SettingsService: Failed to fetch cloud settings', e);
        }

        return this.getDefaultSettings();
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
        if (!window.supabaseClient) return;

        const session = await window.AuthManager.getSession();
        if (!session) {
            // If not logged in, we only update localStorage for immediate UI feedback
            localStorage.setItem(`salatk_${key}`, value);
            this.applySettings({ [key]: value });
            return;
        }

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
                await withTimeout(
                    window.supabaseClient.from('user_settings').upsert(updates),
                    5000
                );
                this.applySettings({ [key]: value });

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
        // Load initial theme/lang to avoid FOUC (Flash of Unstyled Content) if possible
        const settings = await this.getSettings();
        this.applySettings(settings);
    },

    // Apply settings to DOM and cache
    applySettings(settings) {
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
            localStorage.setItem('salatk_theme', settings.theme);

            // Update theme icon if on page
            const sunIcon = document.querySelector('.sun-icon');
            const moonIcon = document.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                if (settings.theme === 'dark') {
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
