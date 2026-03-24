// ========================================
// Variable Service
// Cloud-synced variable assignments per element.
// Each element (prayer, habit, task, time-plan) can have
// a "variable" word (1-5 chars) that links it to other elements
// carrying the same variable.
// ========================================

const VARIABLE_LINKS_TABLE = 'variable_links';
const VARIABLE_LINKS_CACHE_PREFIX = 'salatk_variable_links';
const VARIABLE_LINKS_LEGACY_KEY = 'salatk_variable_links';
const VARIABLE_LINKS_SYNC_TIMEOUT_MS = 5000;

function variableLinksWithTimeout(promise, timeoutMs, timeoutValue = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
    ]);
}

function resolveVariableLinksUserIdSync() {
    const memorySession = window.AuthManager?._session;
    if (memorySession?.user?.id) return memorySession.user.id;

    const snapshot = localStorage.getItem('salatk_auth_snapshot');
    if (!snapshot) return null;

    try {
        const parsed = JSON.parse(snapshot);
        return parsed?.user?.id || null;
    } catch {
        return null;
    }
}

const VariableService = {
    _cacheUserId: null,
    _cache: [],
    _initialized: false,
    _initPromise: null,
    _initPromiseUserId: null,

    // ── Helpers ─────────────────────────────────────────────────

    _resolveUserIdSync() {
        return resolveVariableLinksUserIdSync();
    },

    _getCacheKey(userId = this._resolveUserIdSync()) {
        return `${VARIABLE_LINKS_CACHE_PREFIX}:${userId || 'anon'}`;
    },

    _validate(variable) {
        if (typeof variable !== 'string') return false;
        const trimmed = variable.trim();
        return trimmed.length >= 1 && trimmed.length <= 5;
    },

    _normalizeLink(link, userId = null) {
        if (!link || typeof link !== 'object') return null;

        const variable = typeof link.variable === 'string'
            ? link.variable.trim()
            : typeof link.variable === 'number'
                ? String(link.variable).trim()
                : '';

        const elementType = typeof link.elementType === 'string'
            ? link.elementType.trim()
            : typeof link.element_type === 'string'
                ? link.element_type.trim()
                : '';

        const elementIdRaw = link.elementId ?? link.element_id ?? '';
        const elementId = typeof elementIdRaw === 'string'
            ? elementIdRaw.trim()
            : String(elementIdRaw).trim();

        const trigger = typeof link.trigger === 'string'
            ? link.trigger.trim()
            : typeof link.trigger_value === 'string'
                ? link.trigger_value.trim()
                : '';

        if (!variable || !elementType || !elementId || !trigger) return null;

        return {
            id: link.id || null,
            userId: link.userId || link.user_id || userId || null,
            variable,
            elementType,
            elementId,
            trigger,
            createdAt: link.createdAt || link.created_at || null,
            updatedAt: link.updatedAt || link.updated_at || null
        };
    },

    _dedupeLinks(links) {
        const seen = new Map();

        for (const link of Array.isArray(links) ? links : []) {
            const normalized = this._normalizeLink(link, this._cacheUserId);
            if (!normalized) continue;
            const key = `${normalized.elementType}:${normalized.elementId}`;
            seen.set(key, normalized);
        }

        return [...seen.values()];
    },

    _readLocalLinks(userId = this._resolveUserIdSync()) {
        const cacheKey = this._getCacheKey(userId);
        let raw = localStorage.getItem(cacheKey);

        if (!raw && userId) {
            raw = localStorage.getItem(VARIABLE_LINKS_LEGACY_KEY);
        }

        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return this._dedupeLinks(parsed);
        } catch {
            return [];
        }
    },

    _writeLocalLinks(userId = this._resolveUserIdSync(), links = []) {
        const cacheKey = this._getCacheKey(userId);
        const payload = links
            .map((link) => this._normalizeLink(link, userId))
            .filter(Boolean);

        localStorage.setItem(cacheKey, JSON.stringify(payload));

        if (userId && localStorage.getItem(VARIABLE_LINKS_LEGACY_KEY) !== null) {
            localStorage.removeItem(VARIABLE_LINKS_LEGACY_KEY);
        }
    },

    _setCache(userId, links) {
        const normalized = this._dedupeLinks(links);
        this._cacheUserId = userId;
        this._cache = normalized;
        this._writeLocalLinks(userId, normalized);
        return this.getAll();
    },

    _ensureCacheForCurrentUser() {
        const userId = this._resolveUserIdSync();
        if (this._cacheUserId !== userId || !Array.isArray(this._cache)) {
            this._setCache(userId, this._readLocalLinks(userId));
        }
        return this._cache;
    },

    _cloneLink(link) {
        return link ? { ...link } : null;
    },

    _toCloudPayload(link, userId) {
        return {
            user_id: userId,
            variable: link.variable,
            element_type: link.elementType,
            element_id: link.elementId,
            trigger_value: link.trigger
        };
    },

    _dispatchChange(detail) {
        window.dispatchEvent(new CustomEvent('variableLinksChanged', { detail }));
    },

    async _getSessionUserId() {
        if (!window.AuthManager?.getSession) return null;

        const session = await window.AuthManager.getSession();
        return session?.user?.id || null;
    },

    async _loadCloudLinks(userId) {
        if (!window.supabaseClient || !userId) return [];

        const { data, error } = await variableLinksWithTimeout(
            window.supabaseClient
                .from(VARIABLE_LINKS_TABLE)
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: true }),
            VARIABLE_LINKS_SYNC_TIMEOUT_MS,
            { data: [], error: 'timeout' }
        );

        if (error === 'timeout') {
            return null;
        }

        if (error) {
            throw error;
        }

        return (data || [])
            .map((row) => this._normalizeLink(row, userId))
            .filter(Boolean);
    },

    async _seedCloudLinks(userId, links) {
        if (!window.supabaseClient || !userId || !Array.isArray(links) || links.length === 0) {
            return false;
        }

        const payload = links.map((link) => this._toCloudPayload(link, userId));
        const { error } = await variableLinksWithTimeout(
            window.supabaseClient
                .from(VARIABLE_LINKS_TABLE)
                .upsert(payload, { onConflict: 'user_id,element_type,element_id' }),
            VARIABLE_LINKS_SYNC_TIMEOUT_MS,
            { error: 'timeout' }
        );

        if (error === 'timeout') {
            return false;
        }

        if (error) {
            throw error;
        }

        return true;
    },

    // ── Public API ───────────────────────────────────────────────

    /**
     * Returns all variable link records.
     * @returns {Array<{variable, elementType, elementId, trigger}>}
     */
    getAll() {
        return this._ensureCacheForCurrentUser().map((link) => this._cloneLink(link));
    },

    /**
     * Returns the variable link for a specific element, or null.
     * @param {string} elementType  e.g. 'prayer', 'habit', 'task', 'timeplan'
     * @param {string} elementId    e.g. 'fajr', habit UUID, task UUID, plan UUID
     */
    getForElement(elementType, elementId) {
        const links = this._ensureCacheForCurrentUser();
        return (
            this._cloneLink(
                links.find(
                    (link) => link.elementType === elementType && link.elementId === elementId,
                ) || null,
            )
        );
    },

    /**
     * Returns all elements sharing the given variable.
     * @param {string} variable
     * @returns {Array<{variable, elementType, elementId, trigger}>}
     */
    getLinkedElements(variable) {
        if (!variable) return [];
        const trimmed = String(variable).trim();
        if (!trimmed) return [];

        const links = this._ensureCacheForCurrentUser();
        return links
            .filter((link) => link.variable === trimmed)
            .map((link) => this._cloneLink(link));
    },

    /**
     * Hydrates the current user's cache from local storage and cloud data.
     * Cloud data wins when available; local storage is used as a fallback and
     * as a seed for the first cloud sync.
     */
    async init(options = {}) {
        const force = Boolean(options?.force);
        const userId = (await this._getSessionUserId()) || this._resolveUserIdSync();

        if (!force && this._initialized && this._cacheUserId === userId) {
            return this.getAll();
        }

        if (!force && this._initPromise && this._initPromiseUserId === userId) {
            return this._initPromise;
        }

        this._setCache(userId, this._readLocalLinks(userId));

        const initPromise = (async () => {
            this._initialized = true;

            if (!window.supabaseClient || !userId) {
                return this.getAll();
            }

            try {
                const cloudLinks = await this._loadCloudLinks(userId);

                if (cloudLinks === null) {
                    return this.getAll();
                }

                if (cloudLinks.length > 0) {
                    this._setCache(userId, cloudLinks);
                    return this.getAll();
                }

                const localLinks = this._readLocalLinks(userId);
                if (localLinks.length > 0) {
                    try {
                        await this._seedCloudLinks(userId, localLinks);
                    } catch (seedError) {
                        console.error('VariableService: Failed to seed cloud links', seedError);
                    }
                    this._setCache(userId, localLinks);
                }

                return this.getAll();
            } catch (error) {
                console.error('VariableService: Failed to initialize links', error);
                this._setCache(userId, this._readLocalLinks(userId));
                return this.getAll();
            }
        })();

        this._initPromise = initPromise;
        this._initPromiseUserId = userId;

        try {
            return await initPromise;
        } finally {
            if (this._initPromise === initPromise) {
                this._initPromise = null;
                this._initPromiseUserId = null;
            }
        }
    },

    /**
     * Assigns a variable to an element, replacing any existing assignment.
     * @param {string} variable   1–5 character word
     * @param {string} elementType
     * @param {string} elementId
     * @param {string} trigger    e.g. 'done', 'missed', 'completed', 'avoided'
     * @returns {Promise<{ success: boolean, synced: boolean, error?: string }>}
     */
    async set(variable, elementType, elementId, trigger) {
        const trimmed = (variable || '').trim();
        const safeTrigger = (trigger || '').trim();

        if (!this._validate(trimmed)) {
            return { success: false, synced: false, error: 'INVALID_VARIABLE' };
        }

        if (!elementType || !elementId || !safeTrigger) {
            return { success: false, synced: false, error: 'INVALID_TARGET' };
        }

        const userId = this._resolveUserIdSync();
        const currentLinks = this._ensureCacheForCurrentUser();
        const existing = currentLinks.find(
            (link) => link.elementType === elementType && link.elementId === elementId,
        );
        const now = new Date().toISOString();
        const nextLink = {
            id: existing?.id || null,
            userId: userId || existing?.userId || null,
            variable: trimmed,
            elementType,
            elementId,
            trigger: safeTrigger,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        const nextLinks = currentLinks.filter(
            (link) => !(link.elementType === elementType && link.elementId === elementId),
        );
        nextLinks.push(nextLink);
        this._setCache(userId, nextLinks);

        let synced = false;
        try {
            const sessionUserId = await this._getSessionUserId();
            if (window.supabaseClient && sessionUserId) {
                const { error } = await variableLinksWithTimeout(
                    window.supabaseClient
                        .from(VARIABLE_LINKS_TABLE)
                        .upsert(this._toCloudPayload(nextLink, sessionUserId), {
                            onConflict: 'user_id,element_type,element_id'
                        }),
                    VARIABLE_LINKS_SYNC_TIMEOUT_MS,
                    { error: 'timeout' }
                );

                if (error === 'timeout') {
                    synced = false;
                } else if (error) {
                    throw error;
                } else {
                    synced = true;
                }
            }
        } catch (error) {
            console.error('VariableService: Failed to sync link to cloud', error);
        }

        this._dispatchChange({
            action: 'set',
            link: this._cloneLink(nextLink),
            synced
        });

        return { success: true, synced };
    },

    /**
     * Removes the variable assignment for an element.
     */
    async remove(elementType, elementId) {
        if (!elementType || !elementId) {
            return { success: false, synced: false, error: 'INVALID_TARGET' };
        }

        const userId = this._resolveUserIdSync();
        const currentLinks = this._ensureCacheForCurrentUser();
        const existing = currentLinks.find(
            (link) => link.elementType === elementType && link.elementId === elementId,
        ) || null;
        const nextLinks = currentLinks.filter(
            (link) => !(link.elementType === elementType && link.elementId === elementId),
        );
        this._setCache(userId, nextLinks);

        let synced = false;
        try {
            const sessionUserId = await this._getSessionUserId();
            if (window.supabaseClient && sessionUserId) {
                const { error } = await variableLinksWithTimeout(
                    window.supabaseClient
                        .from(VARIABLE_LINKS_TABLE)
                        .delete()
                        .eq('user_id', sessionUserId)
                        .eq('element_type', elementType)
                        .eq('element_id', elementId),
                    VARIABLE_LINKS_SYNC_TIMEOUT_MS,
                    { error: 'timeout' }
                );

                if (error === 'timeout') {
                    synced = false;
                } else if (error) {
                    throw error;
                } else {
                    synced = true;
                }
            }
        } catch (error) {
            console.error('VariableService: Failed to remove link from cloud', error);
        }

        this._dispatchChange({
            action: 'remove',
            elementType,
            elementId,
            link: this._cloneLink(existing),
            synced
        });

        return { success: true, synced };
    }
};

window.VariableService = VariableService;
