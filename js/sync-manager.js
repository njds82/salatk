// ========================================
// Sync Manager - Cloud Synchronization
// ========================================

const SyncManager = {
    // ========================================
    // Pull Data (Cloud -> Local)
    // ========================================
    async pullAllData() {
        console.log('SyncManager: Pulling all data...');
        const user = await AuthManager.getCurrentUser();
        if (!user) {
            console.log('SyncManager: No user logged in, skipping pull.');
            return false;
        }

        try {
            // 1. Settings
            const { data: settings } = await window.supabaseClient
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // 2. Prayer Records
            const { data: prayers } = await window.supabaseClient
                .from('prayer_records')
                .select('*')
                .eq('user_id', user.id);

            // 3. Qada Prayers
            const { data: qada } = await window.supabaseClient
                .from('qada_prayers')
                .select('*')
                .eq('user_id', user.id);

            // 4. Habits
            const { data: habits } = await window.supabaseClient
                .from('habits')
                .select('*')
                .eq('user_id', user.id);

            // 5. Habit History
            const { data: habitHistory } = await window.supabaseClient
                .from('habit_history')
                .select('*')
                .eq('user_id', user.id);

            // 6. Points
            const { data: points } = await window.supabaseClient
                .from('points_history')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: true }); // Need order for point calculation if we rebuilt total, but we'll trust server sum if we had it, or recalc.

            // 7. Location
            const { data: location } = await window.supabaseClient
                .from('locations')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // --- Reconstruct Local Data Structure ---

            // Start with default
            const localData = getDefaultData();

            // Settings
            if (settings) {
                localData.settings.language = settings.language;
                localData.settings.theme = settings.theme;
                localData.settings.lastVisit = settings.last_visit;
                localData.settings.initialized = new Date(settings.initialized_at).getTime();
            }

            // Prayers: Map array to object by date
            if (prayers) {
                prayers.forEach(p => {
                    if (!localData.prayers[p.date]) localData.prayers[p.date] = {};
                    localData.prayers[p.date][p.prayer_key] = {
                        status: p.status,
                        timestamp: new Date(p.timestamp).getTime()
                    };
                });
            }

            // Qada
            if (qada) {
                localData.qadaPrayers = qada.map(q => ({
                    id: q.id,
                    prayer: q.prayer_key,
                    date: q.original_date,
                    rakaat: q.rakaat,
                    timestamp: new Date(q.timestamp).getTime(),
                    manual: q.is_manual
                }));
            }

            // Habits
            if (habits) {
                const historyMap = {};
                if (habitHistory) {
                    habitHistory.forEach(h => {
                        if (!historyMap[h.habit_id]) historyMap[h.habit_id] = {};
                        historyMap[h.habit_id][h.date] = h.action;
                    });
                }

                localData.habits = habits.map(h => ({
                    id: h.id,
                    name: h.name,
                    type: h.type,
                    created: new Date(h.created_at).getTime(),
                    history: historyMap[h.id] || {}
                }));
            }

            // Points
            if (points) {
                localData.points.history = points.map(p => ({
                    amount: p.amount,
                    reason: p.reason,
                    timestamp: new Date(p.timestamp).getTime()
                }));
                // Recalculate total
                localData.points.total = localData.points.history.reduce((sum, p) => sum + p.amount, 0);
            }

            // Location
            if (location) {
                const locData = {
                    lat: location.latitude,
                    long: location.longitude,
                    lastUpdate: new Date(location.last_update).getTime(),
                    manualMode: location.is_manual_mode
                };
                localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(locData));
            }

            // Save to LocalStorage
            saveData(localData);
            console.log('SyncManager: Pull complete. Local data updated.');
            return true;

        } catch (error) {
            console.error('SyncManager: Pull failed', error);
            // Don't overwrite local data on error
            return false;
        }
    },

    // ========================================
    // Push Data (Local -> Cloud)
    // ========================================

    async pushPrayerRecord(date, prayerKey, status) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('prayer_records')
            .upsert({
                user_id: user.id,
                date: date,
                prayer_key: prayerKey,
                status: status,
                timestamp: new Date().toISOString()
            }, { onConflict: 'user_id, date, prayer_key' });

        if (error) console.error('SyncManager: pushPrayerRecord failed', error);
    },

    async pushQadaRecord(qadaItem) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('qada_prayers')
            .upsert({
                id: qadaItem.id,
                user_id: user.id,
                prayer_key: qadaItem.prayer,
                original_date: qadaItem.date,
                rakaat: qadaItem.rakaat,
                timestamp: new Date(qadaItem.timestamp).toISOString(),
                is_manual: qadaItem.manual || false,
                is_made_up: false
            });

        if (error) console.error('SyncManager: pushQadaRecord failed', error);
    },

    async removeQadaRecord(qadaId) {
        if (!AuthManager.isAuthenticated()) return;
        const { error } = await window.supabaseClient
            .from('qada_prayers')
            .delete()
            .eq('id', qadaId);

        if (error) console.error('SyncManager: removeQadaRecord failed', error);
    },

    async pushHabit(habit) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('habits')
            .upsert({
                id: habit.id,
                user_id: user.id,
                name: habit.name,
                type: habit.type,
                created_at: new Date(habit.created).toISOString()
            });

        if (error) console.error('SyncManager: pushHabit failed', error);
    },

    async deleteHabit(habitId) {
        if (!AuthManager.isAuthenticated()) return;
        const { error } = await window.supabaseClient
            .from('habits')
            .delete()
            .eq('id', habitId);

        if (error) console.error('SyncManager: deleteHabit failed', error);
    },

    async pushHabitAction(habitId, date, action) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('habit_history')
            .upsert({
                user_id: user.id,
                habit_id: habitId,
                date: date,
                action: action,
                timestamp: new Date().toISOString()
            }, { onConflict: 'user_id, habit_id, date' });

        if (error) console.error('SyncManager: pushHabitAction failed', error);
    },

    async removeHabitAction(habitId, date) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser(); // Need ID for composite key safety or use RLS

        const { error } = await window.supabaseClient
            .from('habit_history')
            .delete()
            .match({ habit_id: habitId, date: date });

        if (error) console.error('SyncManager: removeHabitAction failed', error);
    },

    async pushPoint(amount, reason) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('points_history')
            .insert({
                user_id: user.id,
                amount: amount,
                reason: reason,
                timestamp: new Date().toISOString()
            });

        if (error) console.error('SyncManager: pushPoint failed', error);
    },

    async pushSettings(settings) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('user_settings')
            .upsert({
                user_id: user.id,
                language: settings.language,
                theme: settings.theme,
                last_visit: settings.lastVisit,
                updated_at: new Date().toISOString()
            });

        if (error) console.error('SyncManager: pushSettings failed', error);
    },

    async pushLocation(locData) {
        if (!AuthManager.isAuthenticated()) return;
        const user = await AuthManager.getCurrentUser();

        const { error } = await window.supabaseClient
            .from('locations')
            .upsert({
                user_id: user.id,
                latitude: locData.lat,
                longitude: locData.long,
                is_manual_mode: locData.manualMode,
                last_update: new Date(locData.lastUpdate).toISOString()
            });

        if (error) console.error('SyncManager: pushLocation failed', error);
    }
};

window.SyncManager = SyncManager;
