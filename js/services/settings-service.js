// ========================================
// Settings Service
// ========================================

const SettingsService = {
    // Get all settings as an object
    async getSettings() {
        const allKeys = await db.settings.toArray();
        const settings = {
            language: 'ar',
            theme: 'light',
            calculationMethod: 'UmmAlQura',
            madhab: 'Shafi',
            lastVisit: new Date().toISOString().split('T')[0],
            initialized: Date.now()
        };

        allKeys.forEach(item => {
            settings[item.key] = item.value;
        });

        return settings;
    },

    // Get single setting
    async get(key, defaultValue) {
        const item = await db.settings.get(key);
        return item ? item.value : defaultValue;
    },

    // Set setting
    async set(key, value) {
        await db.settings.put({ key, value });

        this.applySettings({ [key]: value });

        // Sync
        if (window.SyncManager) {
            // We need to fetch full object to push? Or update SyncManager to accept key/val?
            // SyncManager.pushSettings expects an object.
            const fullSettings = await this.getSettings();
            await SyncManager.pushSettings(fullSettings);
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
