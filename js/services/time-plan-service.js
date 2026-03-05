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
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    },

    async _getSession() {
        if (!window.AuthManager) return null;
        return await window.AuthManager.getSession();
    },

    async _withTimeout(promise, timeoutMs, timeoutValue = null) {
        let timeoutId;
        const timeoutPromise = new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
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
        if (!window.supabaseClient) return null;
        const session = await this._getSession();
        if (!session) return null;

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
            throw new Error('PLAN_CREATE_FAILED');
        }

        return this._mapRow(data);
    },

    async updatePlan(planId, { title, notes, startTime, endTime }) {
        if (!window.supabaseClient || !planId) return null;
        const session = await this._getSession();
        if (!session) return null;

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
            throw new Error('PLAN_UPDATE_FAILED');
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
        if (!window.supabaseClient) return [];
        const session = await this._getSession();
        if (!session) return [];

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
            return [];
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
            return [];
        }

        return (data || []).map(row => this._mapRow(row));
    }
};

window.TimePlanService = TimePlanService;
