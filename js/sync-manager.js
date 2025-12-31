// ========================================
// Sync Manager (Cloud-Only Version)
// ========================================
// Optimized for direct cloud access. Pull/Push logic removed as per user request.

const SyncManager = {
    // ========================================
    // Lifecycle
    // ========================================
    async pullAllData() {
        console.log('SyncManager: Local storage is disabled. Pull skipped.');
        return true;
    },

    async pushAllLocalData() {
        console.log('SyncManager: Local storage is disabled. Push skipped.');
        return true;
    },

    // ========================================
    // Legacy Hooks (Kept for compatibility with other components)
    // Most logic now lives directly in Services.
    // ========================================
    async pushSettings(settings) { /* Direct cloud call now in SettingsService */ },
    async pushPrayerRecord(date, prayerKey, status) { /* Direct cloud call in PrayerService */ },
    async deletePrayerRecord(date, prayerKey) { /* Direct cloud call in PrayerService */ },
    async pushQadaRecord(qadaItem) { /* Direct cloud call in PrayerService */ },
    async removeQadaRecord(qadaId) { /* Direct cloud call in PrayerService */ },
    async pushHabit(habit) { /* Direct cloud call in HabitService */ },
    async deleteHabit(habitId) { /* Direct cloud call in HabitService */ },
    async pushHabitAction(habitId, date, action) { /* Direct cloud call in HabitService */ },
    async removeHabitAction(habitId, date) { /* Direct cloud call in HabitService */ },
    async pushPoint(amount, reason, id) { /* Direct cloud call in PointsService */ },
    async removePoint(id) { /* Direct cloud call in PointsService */ },

    // ========================================
    // Realtime Subscriptions
    // ========================================
    subscribeToChanges() {
        if (!window.supabaseClient) return;

        console.log('SyncManager: Subscribing to realtime changes...');

        window.supabaseClient
            .channel('public:db_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                async (payload) => {
                    const { data: { session } } = await window.supabaseClient.auth.getSession();
                    if (!session) return;

                    const userId = session.user.id;
                    const record = payload.new || payload.old;

                    if (record && record.user_id && record.user_id !== userId) return;

                    console.log('Realtime Change Received:', payload.table, payload.eventType);
                    await this.handleRealtimeEvent(payload);
                }
            )
            .subscribe();
    },

    async handleRealtimeEvent(payload) {
        const { table, eventType } = payload;

        try {
            // In cloud-only mode, we mostly trigger UI refreshes
            switch (table) {
                case 'prayer_records':
                    if (window.currentPage === 'daily-prayers' && window.renderPage) {
                        renderPage('daily-prayers', true);
                    }
                    break;
                case 'qada_prayers':
                    if (window.currentPage === 'qada-prayers' && window.renderPage) {
                        renderPage('qada-prayers', true);
                    }
                    break;
                case 'habits':
                case 'habit_history':
                    if (window.currentPage === 'habits' && window.renderPage) {
                        renderPage('habits', true);
                    }
                    break;
                case 'user_settings':
                    if (eventType !== 'DELETE') {
                        // Refresh settings if they changed externally
                        if (window.currentPage === 'settings') {
                            renderPage('settings', true);
                        } else {
                            // Indirectly refresh theme/lang if needed
                            const settings = await SettingsService.getSettings();
                            SettingsService.applySettings(settings);
                        }
                    }
                    break;
                case 'points_history':
                    await updatePointsDisplay();
                    if (window.currentPage === 'leaderboard') {
                        renderPage('leaderboard', true);
                    }
                    break;
            }
        } catch (err) {
            console.error('Error handling realtime event:', err);
        }
    },

    // Helper: Ensure profile record exists
    async ensureProfileExists(user) {
        try {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile) {
                await window.supabaseClient.from('profiles').upsert({
                    id: user.id,
                    username: user.user_metadata?.username || user.email?.split('@')[0],
                    full_name: user.user_metadata?.full_name || 'User'
                });
            }
        } catch (e) {
            console.error('SyncManager: Profile setup failed', e);
        }
    }
};

window.SyncManager = SyncManager;
