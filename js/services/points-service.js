// ========================================
// Points Service
// ========================================

// Helper to wrap a promise with a timeout
async function withTimeout(promise, timeoutMs, timeoutValue = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
    ]);
}

const POINTS_TOTAL_TTL_MS = 10000;

const PointsService = {
    _totalCache: {
        userId: null,
        total: 0,
        expiresAt: 0
    },

    _setTotalCache(userId, total) {
        const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0;
        this._totalCache = {
            userId,
            total: safeTotal,
            expiresAt: Date.now() + POINTS_TOTAL_TTL_MS
        };
        return safeTotal;
    },

    _getCachedTotal(userId) {
        if (this._totalCache.userId !== userId) return null;
        if (this._totalCache.expiresAt <= Date.now()) return null;
        return this._totalCache.total;
    },

    invalidateTotalCache(userId = null) {
        if (userId && this._totalCache.userId !== userId) return;
        this._totalCache = {
            userId: null,
            total: 0,
            expiresAt: 0
        };
    },

    async getTotal(options = { forceRefresh: false }) {
        if (!window.supabaseClient) return 0;

        const session = await window.AuthManager.getSession();
        if (!session) return 0;

        const forceRefresh = Boolean(options?.forceRefresh);
        const userId = session.user.id;
        if (!forceRefresh) {
            const cachedTotal = this._getCachedTotal(userId);
            if (cachedTotal !== null) return cachedTotal;
        }

        try {
            // Fetch from leaderboard view for pre-calculated total
            const { data, error } = await withTimeout(
                window.supabaseClient
                    .from('leaderboard')
                    .select('total_points')
                    .eq('user_id', userId)
                    .maybeSingle(),
                5000,
                { data: null, error: 'timeout' }
            );

            if (error || !data) {
                if (error && error !== 'timeout') {
                    console.error('PointsService: Error fetching total from view', error);
                }

                // Fallback to manual sum if view fails or user not in view yet
                // Increase limit to 10,000 to handle users with many activities
                const { data: fallbackData, error: fallbackError } = await window.supabaseClient
                    .from('points_history')
                    .select('amount')
                    .eq('user_id', userId)
                    .limit(10000);

                if (fallbackError) {
                    console.error('PointsService: Fallback fetch failed', fallbackError);
                    return 0;
                }

                const total = (fallbackData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
                return this._setTotalCache(userId, total);
            }

            return this._setTotalCache(userId, data.total_points);
        } catch (e) {
            console.error('PointsService: Failed to fetch total points', e);
            const cachedTotal = this._getCachedTotal(userId);
            return cachedTotal !== null ? cachedTotal : 0;
        }
    },

    async getHistory() {
        if (!window.supabaseClient) return [];
        const session = await window.AuthManager.getSession();
        if (!session) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('points_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('recorded_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(p => ({
                id: p.id,
                amount: p.amount,
                reason: p.reason,
                timestamp: new Date(p.recorded_at).getTime()
            }));
        } catch (e) {
            console.error('PointsService: Failed to fetch points history', e);
            return [];
        }
    },

    async addPoints(amount, reason, providedId = null) {
        if (!window.supabaseClient) {
            console.error('[PointsService] supabaseClient not found');
            return false;
        }
        const session = await window.AuthManager.getSession();
        if (!session) {
            console.error('[PointsService] No session found');
            return false;
        }

        const id = providedId || crypto.randomUUID();
        console.log(`[PointsService] Adding ${amount} points for ${reason} (ID: ${id})`);

        if (amount === 0 && providedId) {
            const { error } = await window.supabaseClient.from('points_history').delete().eq('id', providedId);
            if (error) return false;

            this.invalidateTotalCache(session.user.id);
            const total = await this.getTotal({ forceRefresh: true });
            window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { totalPoints: total } }));
            return true;
        }

        try {
            const { error } = await window.supabaseClient.from('points_history').upsert({
                id: id,
                user_id: session.user.id,
                amount: amount,
                reason: reason,
                recorded_at: new Date().toISOString()
            });

            if (error) {
                console.error('PointsService: Error adding points', error);
                return false;
            }

            console.log('[PointsService] Points added successfully');
            this.invalidateTotalCache(session.user.id);

            // Dispatch update event for local UI components
            const total = await this.getTotal({ forceRefresh: true });
            window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { totalPoints: total } }));
            return true;
        } catch (e) {
            console.error('PointsService: Exception adding points', e);
            return false;
        }
    },

    async deduplicatePoints() {
        // Legacy cleanup - usually not needed in cloud-only mode but left as a stub or removed
        console.log('PointsService: Deduplication not required in cloud-only mode');
    }
};

window.PointsService = PointsService;
