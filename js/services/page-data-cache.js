// ========================================
// Page Data Cache Service
// ========================================

const PAGE_CACHE_TTLS_MS = {
    settings: 30000,
    statistics: 30000,
    leaderboard: 30000,
    habits: 20000,
    store: 20000
};

const POINTS_RELATED_PAGES = ['statistics', 'leaderboard', 'store', 'settings'];

const PageDataCache = {
    _entries: new Map(),
    _initialized: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        window.addEventListener('languageChanged', () => {
            this.clear();
        });

        window.addEventListener('authSessionChanged', () => {
            this.clear();
        });

        window.addEventListener('pointsUpdated', () => {
            this.invalidatePages(POINTS_RELATED_PAGES);
        });
    },

    getTTL(page) {
        return PAGE_CACHE_TTLS_MS[page] || 15000;
    },

    _getSessionId() {
        const memorySession = window.AuthManager?._session;
        if (memorySession?.user?.id) return memorySession.user.id;

        const snapshot = localStorage.getItem('salatk_auth_snapshot');
        if (!snapshot) return 'anon';

        try {
            const parsed = JSON.parse(snapshot);
            return parsed?.user?.id || 'anon';
        } catch (error) {
            return 'anon';
        }
    },

    _getLanguage() {
        return document.documentElement.lang
            || localStorage.getItem('salatk_language')
            || localStorage.getItem('salatk_lang')
            || 'ar';
    },

    _serializeContext(context = {}) {
        if (!context || typeof context !== 'object') return '{}';
        const sortedEntries = Object.entries(context).sort(([a], [b]) => a.localeCompare(b));
        return JSON.stringify(Object.fromEntries(sortedEntries));
    },

    _makeKey(page, context = {}) {
        return `${this._getSessionId()}::${this._getLanguage()}::${page}::${this._serializeContext(context)}`;
    },

    get(page, context = {}) {
        const key = this._makeKey(page, context);
        const entry = this._entries.get(key);
        if (!entry) return null;

        if (entry.expiresAt <= Date.now()) {
            this._entries.delete(key);
            return null;
        }

        return {
            key,
            page,
            html: entry.html,
            createdAt: entry.createdAt,
            expiresAt: entry.expiresAt
        };
    },

    set(page, context = {}, html, ttlMs = null) {
        if (typeof html !== 'string') return;
        const safeTtl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : this.getTTL(page);
        const now = Date.now();
        const key = this._makeKey(page, context);

        this._entries.set(key, {
            html,
            createdAt: now,
            expiresAt: now + safeTtl
        });
    },

    invalidatePage(page) {
        for (const key of this._entries.keys()) {
            const parts = key.split('::');
            if (parts[2] === page) {
                this._entries.delete(key);
            }
        }
    },

    invalidatePages(pages = []) {
        const safePages = Array.isArray(pages) ? pages : [];
        safePages.forEach((page) => this.invalidatePage(page));
    },

    clear() {
        this._entries.clear();
    },

    pruneExpired() {
        const now = Date.now();
        for (const [key, entry] of this._entries.entries()) {
            if (entry.expiresAt <= now) {
                this._entries.delete(key);
            }
        }
    }
};

PageDataCache.init();
window.PageDataCache = PageDataCache;
