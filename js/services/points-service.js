// ========================================
// Points Service
// ========================================

const PointsService = {
    async getTotal() {
        if (!window.supabaseClient) return 0;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return 0;

        const { data, error } = await window.supabaseClient
            .from('points_history')
            .select('amount')
            .eq('user_id', session.user.id);

        if (error) return 0;
        return (data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    },

    async getHistory() {
        if (!window.supabaseClient) return [];
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return [];

        const { data } = await window.supabaseClient
            .from('points_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('recorded_at', { ascending: false });

        return (data || []).map(p => ({
            id: p.id,
            amount: p.amount,
            reason: p.reason,
            timestamp: new Date(p.recorded_at).getTime()
        }));
    },

    async addPoints(amount, reason, providedId = null) {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const id = providedId || crypto.randomUUID();

        if (amount === 0 && providedId) {
            await window.supabaseClient.from('points_history').delete().eq('id', providedId);
            return;
        }

        try {
            await window.supabaseClient.from('points_history').upsert({
                id: id,
                user_id: session.user.id,
                amount: amount,
                reason: reason,
                recorded_at: new Date().toISOString()
            });

            // Dispatch update event for local UI components
            const total = await this.getTotal();
            window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { totalPoints: total } }));
        } catch (e) {
            console.error('PointsService: Error adding points', e);
        }
    },

    async deduplicatePoints() {
        // Legacy cleanup - usually not needed in cloud-only mode but left as a stub or removed
        console.log('PointsService: Deduplication not required in cloud-only mode');
    }
};

window.PointsService = PointsService;
