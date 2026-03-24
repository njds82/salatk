// ========================================
// Time Plan Service (Daily/Weekly)
// ========================================

const TimePlanService = {
    _timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const normalized = this._normalizeTime(timeStr);
        const [h, m] = normalized.split(':').map(Number);
        return h * 60 + m;
    },

    _normalizeTime(timeStr) {
        if (!timeStr) return '';
        const parts = String(timeStr).split(':');
        if (parts.length < 2) return '';
        const h = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        return `${h}:${m}`;
    },

    _validateTime(timeStr, fieldName) {
        const normalized = this._normalizeTime(timeStr);
        if (!/^\d{2}:\d{2}$/.test(normalized)) {
            throw new Error(`${fieldName}_INVALID`);
        }
        const [h, m] = normalized.split(':').map(Number);
        if (h < 0 || h > 23 || m < 0 || m > 59) {
            throw new Error(`${fieldName}_INVALID`);
        }
        return normalized;
    },

    _validateTitle(title) {
        const safeTitle = (title || '').trim();
        if (!safeTitle) throw new Error('TITLE_REQUIRED');
        if (safeTitle.length > 140) throw new Error('TITLE_TOO_LONG');
        return safeTitle;
    },

    _validateNotes(notes) {
        const safeNotes = (notes || '').trim();
        if (safeNotes.length > 500) throw new Error('NOTES_TOO_LONG');
        return safeNotes;
    },

    _validateScope(scope) {
        const safeScope = scope === 'weekly' ? 'weekly' : 'daily';
        return safeScope;
    },

    _validateDate(dateStr) {
        const safeDate = dateStr || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) {
            throw new Error('DATE_INVALID');
        }
        return safeDate;
    },

    _validateWeekday(weekday) {
        const value = Number(weekday);
        if (!Number.isInteger(value) || value < 0 || value > 6) {
            throw new Error('WEEKDAY_INVALID');
        }
        return value;
    },

    _validateTimeRange(startTime, endTime) {
        const startMinutes = this._timeToMinutes(startTime);
        const endMinutes = this._timeToMinutes(endTime);
        if (startMinutes >= endMinutes) {
            throw new Error('TIME_RANGE_INVALID');
        }
    },

    _mapRow(row) {
        if (!row) return null;
        return {
            id: row.id,
            scope: row.scope,
            date: row.date,
            weekday: typeof row.weekday === 'number' ? row.weekday : (row.weekday === null ? null : Number(row.weekday)),
            title: row.title,
            notes: row.notes,
            startTime: this._normalizeTime(row.start_time),
            endTime: this._normalizeTime(row.end_time),
            isDone: typeof row.is_done === 'boolean' ? row.is_done : undefined,
            doneAt: row.done_at || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    },

    async _getSession() {
        if (!window.AuthManager) return null;
        return await window.AuthManager.getSession();
    },

    _resolveUserIdSync() {
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
    },

    async _withTimeout(promise, timeoutMs, timeoutValue = null) {
        let timeoutId;
        const timeoutPromise = new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    },

    _getDoneStateKey(userId = this._resolveUserIdSync()) {
        return `salatk_timeplan_done:${userId || 'anon'}`;
    },

    _parseDoneEntries(raw) {
        if (!raw) return {};
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return {};
            }

            return Object.fromEntries(
                Object.entries(parsed)
                    .map(([planId, value]) => [planId, this._normalizeDoneEntry(value)])
                    .filter(([, entry]) => Boolean(entry))
            );
        } catch {
            return {};
        }
    },

    _normalizeDoneEntry(entry) {
        if (typeof entry === 'boolean') {
            return {
                value: entry,
                updatedAt: null
            };
        }

        if (!entry || typeof entry !== 'object') {
            return null;
        }

        return {
            value: Boolean(entry.value),
            updatedAt: typeof entry.updatedAt === 'string' && entry.updatedAt.trim()
                ? entry.updatedAt.trim()
                : null
        };
    },

    _readDoneEntries(userId = this._resolveUserIdSync()) {
        const key = this._getDoneStateKey(userId);
        const raw = localStorage.getItem(key);

        if (raw) return this._parseDoneEntries(raw);

        if (userId) {
            const legacy = localStorage.getItem('salatk_timeplan_done');
            if (legacy) return this._parseDoneEntries(legacy);
        }

        return {};
    },

    getDoneEntries() {
        return this._readDoneEntries();
    },

    getDoneMap() {
        const entries = this.getDoneEntries();
        return Object.fromEntries(
            Object.entries(entries).map(([planId, entry]) => [planId, Boolean(entry?.value)])
        );
    },

    getDoneEntry(planId) {
        if (!planId) return null;
        const entries = this.getDoneEntries();
        return entries[planId] ? { ...entries[planId] } : null;
    },

    _saveDoneEntries(userId, entries) {
        const safeUserId = userId || null;
        const key = this._getDoneStateKey(safeUserId);
        localStorage.setItem(key, JSON.stringify(entries || {}));

        if (safeUserId && localStorage.getItem('salatk_timeplan_done') !== null) {
            localStorage.removeItem('salatk_timeplan_done');
        }
    },

    _setDoneEntry(planId, value, updatedAt = new Date().toISOString(), userId = this._resolveUserIdSync()) {
        const entries = this._readDoneEntries(userId);
        entries[planId] = {
            value: Boolean(value),
            updatedAt: typeof updatedAt === 'string' && updatedAt.trim() ? updatedAt.trim() : new Date().toISOString()
        };
        this._saveDoneEntries(userId, entries);
        return { ...entries[planId] };
    },

    syncDoneStateFromCloud(planId, isDone, updatedAt = null, userId = this._resolveUserIdSync()) {
        if (!planId) return null;
        const entries = this._readDoneEntries(userId);
        entries[planId] = {
            value: Boolean(isDone),
            updatedAt: typeof updatedAt === 'string' && updatedAt.trim() ? updatedAt.trim() : new Date().toISOString()
        };
        this._saveDoneEntries(userId, entries);
        return { ...entries[planId] };
    },

    clearDoneEntry(planId, userId = this._resolveUserIdSync()) {
        if (!planId) return false;
        const entries = this._readDoneEntries(userId);
        if (!Object.prototype.hasOwnProperty.call(entries, planId)) return false;
        delete entries[planId];
        this._saveDoneEntries(userId, entries);
        return true;
    },

    getPlanDoneState(planId) {
        if (!planId) return false;
        const map = this.getDoneMap();
        return !!map[planId];
    },

    async setPlanDone(planId, isDone) {
        if (!planId) {
            return { success: false, synced: false, error: 'PLAN_ID_REQUIRED' };
        }

        const userId = this._resolveUserIdSync();
        const localStamp = new Date().toISOString();
        this._setDoneEntry(planId, isDone, localStamp, userId);

        if (!window.supabaseClient) {
            return { success: true, synced: false };
        }

        const session = await this._getSession();
        if (!session?.user?.id) {
            return { success: true, synced: false };
        }

        try {
            const { data, error } = await this._withTimeout(
                window.supabaseClient
                    .from('time_plans')
                    .update({
                        is_done: Boolean(isDone)
                    })
                    .eq('user_id', session.user.id)
                    .eq('id', planId)
                    .select('*')
                    .maybeSingle(),
                8000,
                { data: null, error: 'timeout' }
            );

            if (error === 'timeout') {
                return {
                    success: true,
                    synced: false
                };
            }

            if (error) {
                throw error;
            }

            if (!data) {
                return {
                    success: true,
                    synced: false
                };
            }

            if (session.user.id) {
                this.syncDoneStateFromCloud(planId, isDone, data?.updatedAt || data?.updated_at || localStamp, session.user.id);
            }

            return {
                success: true,
                synced: true,
                plan: this._mapRow(data)
            };
        } catch (error) {
            console.error('TimePlanService: Failed to sync plan done state', error);
            return {
                success: true,
                synced: false,
                error
            };
        }
    },

    async getDailyPlans(dateStr) {
        if (!window.supabaseClient) return [];
        const session = await this._getSession();
        if (!session) return [];

        const safeDate = this._validateDate(dateStr);

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('scope', 'daily')
                .eq('date', safeDate)
                .order('start_time', { ascending: true }),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TimePlanService: Failed to fetch daily plans', error);
            return [];
        }

        return (data || []).map(row => this._mapRow(row));
    },

    async getWeeklyPlans() {
        if (!window.supabaseClient) return [];
        const session = await this._getSession();
        if (!session) return [];

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('scope', 'weekly')
                .order('weekday', { ascending: true })
                .order('start_time', { ascending: true }),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TimePlanService: Failed to fetch weekly plans', error);
            return [];
        }

        return (data || []).map(row => this._mapRow(row));
    },

    async getPlanById(planId) {
        if (!window.supabaseClient || !planId) return null;
        const session = await this._getSession();
        if (!session) return null;

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('id', planId)
                .maybeSingle(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TimePlanService: Failed to fetch plan', error);
            return null;
        }

        return this._mapRow(data);
    },

    async createPlan({ scope, date, weekday, title, notes, startTime, endTime }) {
        if (!window.supabaseClient) {
            throw new Error('SUPABASE_NOT_READY');
        }
        const session = await this._getSession();
        if (!session) {
            throw new Error('AUTH_REQUIRED');
        }

        const safeScope = this._validateScope(scope);
        const safeTitle = this._validateTitle(title);
        const safeNotes = this._validateNotes(notes);
        const safeStart = this._validateTime(startTime, 'START_TIME');
        const safeEnd = this._validateTime(endTime, 'END_TIME');
        this._validateTimeRange(safeStart, safeEnd);

        let safeDate = null;
        let safeWeekday = null;

        if (safeScope === 'daily') {
            safeDate = this._validateDate(date);
        } else {
            safeWeekday = this._validateWeekday(weekday);
        }

        const payload = {
            user_id: session.user.id,
            scope: safeScope,
            date: safeDate,
            weekday: safeWeekday,
            title: safeTitle,
            notes: safeNotes || null,
            start_time: safeStart,
            end_time: safeEnd
        };

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .insert(payload)
                .select('*')
                .single(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error) {
            console.error('TimePlanService: Failed to create plan', error);
            const err = new Error(error.message || 'PLAN_CREATE_FAILED');
            err.code = error.code;
            err.details = error;
            throw err;
        }

        return this._mapRow(data);
    },

    async updatePlan(planId, { title, notes, startTime, endTime }) {
        if (!window.supabaseClient || !planId) {
            throw new Error('SUPABASE_NOT_READY');
        }
        const session = await this._getSession();
        if (!session) {
            throw new Error('AUTH_REQUIRED');
        }

        const current = await this.getPlanById(planId);
        if (!current) throw new Error('PLAN_NOT_FOUND');

        const safeTitle = typeof title !== 'undefined' ? this._validateTitle(title) : current.title;
        const safeNotes = typeof notes !== 'undefined' ? this._validateNotes(notes) : (current.notes || '');
        const safeStart = typeof startTime !== 'undefined' ? this._validateTime(startTime, 'START_TIME') : current.startTime;
        const safeEnd = typeof endTime !== 'undefined' ? this._validateTime(endTime, 'END_TIME') : current.endTime;
        this._validateTimeRange(safeStart, safeEnd);

        const updates = {
            title: safeTitle,
            notes: safeNotes || null,
            start_time: safeStart,
            end_time: safeEnd
        };

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .update(updates)
                .eq('user_id', session.user.id)
                .eq('id', planId)
                .select('*')
                .single(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error) {
            console.error('TimePlanService: Failed to update plan', error);
            const err = new Error(error.message || 'PLAN_UPDATE_FAILED');
            err.code = error.code;
            err.details = error;
            throw err;
        }

        return this._mapRow(data);
    },

    async deletePlan(planId) {
        if (!window.supabaseClient || !planId) return false;
        const session = await this._getSession();
        if (!session) return false;

        const { error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .delete()
                .eq('user_id', session.user.id)
                .eq('id', planId),
            8000,
            { error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TimePlanService: Failed to delete plan', error);
            return false;
        }

        return true;
    },

    _getWeekdayIndex(dateStr) {
        const date = new Date(`${dateStr}T00:00:00`);
        return date.getDay();
    },

    async replaceDailyWithWeekly(dateStr) {
        if (!window.supabaseClient) {
            throw new Error('SUPABASE_NOT_READY');
        }
        const session = await this._getSession();
        if (!session) {
            throw new Error('AUTH_REQUIRED');
        }

        const safeDate = this._validateDate(dateStr);
        const weekday = this._getWeekdayIndex(safeDate);

        // Delete existing daily plans for this date
        const { error: deleteError } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .delete()
                .eq('user_id', session.user.id)
                .eq('scope', 'daily')
                .eq('date', safeDate),
            8000,
            { error: 'timeout' }
        );

        if (deleteError && deleteError !== 'timeout') {
            console.error('TimePlanService: Failed to clear daily plans', deleteError);
            const err = new Error(deleteError.message || 'PLAN_DELETE_FAILED');
            err.code = deleteError.code;
            err.details = deleteError;
            throw err;
        }

        const weeklyPlans = await this.getWeeklyPlans();
        const matching = weeklyPlans.filter(plan => plan.weekday === weekday);

        if (matching.length === 0) return [];

        const rows = matching.map(plan => ({
            user_id: session.user.id,
            scope: 'daily',
            date: safeDate,
            weekday: null,
            title: plan.title,
            notes: plan.notes || null,
            start_time: plan.startTime,
            end_time: plan.endTime
        }));

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('time_plans')
                .insert(rows)
                .select('*'),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TimePlanService: Failed to insert copied plans', error);
            const err = new Error(error.message || 'PLAN_COPY_FAILED');
            err.code = error.code;
            err.details = error;
            throw err;
        }

        return (data || []).map(row => this._mapRow(row));
    }
};

window.TimePlanService = TimePlanService;
