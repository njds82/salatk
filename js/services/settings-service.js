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

        // specific side effects
        if (key === 'language') {
            document.documentElement.lang = value;
            document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
        }
        if (key === 'theme') {
            document.documentElement.setAttribute('data-theme', value);
        }

        // Sync
        if (window.SyncManager) {
            // We need to fetch full object to push? Or update SyncManager to accept key/val?
            // SyncManager.pushSettings expects an object.
            const fullSettings = await this.getSettings();
            SyncManager.pushSettings(fullSettings);
        }
    },

    async init() {
        // Load initial theme/lang to avoid FOUC (Flash of Unstyled Content) if possible
        // But this is async... so index.html might need a small synchronous inline script or default css
        // For now, we rely on the page load logic.
    }
};

window.SettingsService = SettingsService;
