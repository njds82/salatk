// ========================================
// Sync Manager (Optimized & Async)
// ========================================

const SyncManager = {
    // ========================================
    // Pull Data (Cloud -> Local)
    // ========================================
    async pullAllData() {
        console.log('SyncManager: Pulling all data...');
        if (!window.supabaseClient) return false;

        // Check auth directly to avoid circular dependency loop if AuthManager used SyncManager
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            console.log('SyncManager: No user logged in, skipping pull.');
            return false;
        }
        const userId = session.user.id;

        try {
            // Parallel Fetch using Promise.all
            const promises = [
                window.supabaseClient.from('user_settings').select('*').eq('user_id', userId).single(),
                window.supabaseClient.from('prayer_records').select('*').eq('user_id', userId),
                window.supabaseClient.from('qada_prayers').select('*').eq('user_id', userId),
                window.supabaseClient.from('habits').select('*').eq('user_id', userId),
                window.supabaseClient.from('habit_history').select('*').eq('user_id', userId),
                window.supabaseClient.from('points_history').select('*').eq('user_id', userId),
                window.supabaseClient.from('locations').select('*').eq('user_id', userId).single()
            ];

            const [
                { data: settings },
                { data: prayers },
                { data: qada },
                { data: habits },
                { data: habitHistory },
                { data: points },
                { data: location }
            ] = await Promise.all(promises);

            // --- Update IndexedDB in Bulk ---

            // 1. Settings
            if (settings) {
                const settingsEntries = [
                    { key: 'language', value: settings.language },
                    { key: 'theme', value: settings.theme },
                    { key: 'lastVisit', value: settings.last_visit },
                    { key: 'initialized', value: new Date(settings.initialized_at || Date.now()).getTime() }
                ];
                await db.settings.bulkPut(settingsEntries);
            }

            // 2. Prayers
            if (prayers && prayers.length > 0) {
                const prayerRecords = prayers.map(p => ({
                    date: p.date,
                    key: p.prayer_key,
                    status: p.status,
                    timestamp: new Date(p.timestamp).getTime()
                }));
                await db.prayers.bulkPut(prayerRecords);
            }

            // 3. Qada
            if (qada && qada.length > 0) {
                const qadaRecords = qada.map(q => ({
                    id: q.id, // Ensure UUID consistency from UUID in DB
                    prayer: q.prayer_key,
                    date: q.original_date,
                    rakaat: q.rakaat,
                    timestamp: new Date(q.timestamp).getTime(),
                    manual: q.is_manual
                }));
                await db.qada.bulkPut(qadaRecords);
            }

            // 4. Habits
            if (habits && habits.length > 0) {
                const habitRecords = habits.map(h => ({
                    id: h.id,
                    name: h.name,
                    type: h.type,
                    created: new Date(h.created_at).getTime()
                }));
                await db.habits.bulkPut(habitRecords);
            }

            // 5. Habit History
            if (habitHistory && habitHistory.length > 0) {
                const historyRecords = habitHistory.map(h => ({
                    habitId: h.habit_id,
                    date: h.date,
                    action: h.action
                }));
                await db.habit_history.bulkPut(historyRecords);
            }

            // 6. Points
            if (points && points.length > 0) {
                // Danger: Duplication if we just add.
                // We should probably rely on the Cloud as source of truth for total history?
                // Or just overwrite if we want valid full sync.
                // Dexie 'bulkPut' uses keys. 'points' table key is ++id (auto). 
                // We don't have UUIDs in local schema for points, only timestamp (non-unique).
                // To avoid duplication, we might clear local points and re-fill?
                // Strategy: Clear local points and replace with cloud points (Simplest for accuracy)
                await db.points.clear();
                const pointRecords = points.map(p => ({
                    amount: p.amount,
                    reason: p.reason,
                    timestamp: new Date(p.timestamp).getTime() // We lose original ordering ID unless we sort
                }));
                await db.points.bulkAdd(pointRecords);
            }

            // 7. Location
            if (location) {
                // Store in settings or separate store
                // We have a 'locations' store in db.js singleton
                await db.locations.put({
                    id: 'user_location',
                    lat: location.latitude,
                    long: location.longitude,
                    manualMode: location.is_manual_mode,
                    lastUpdate: new Date(location.last_update).getTime()
                });
            }

            console.log('SyncManager: Pull complete. IndexedDB updated.');
            return true;

        } catch (error) {
            console.error('SyncManager: Pull failed', error);
            return false;
        }
    },

    // ========================================
    // Push Data (Local -> Cloud)
    // ========================================
    // ... Keeping individual push methods as they are sufficient for "Write-Through" cache strategy ...

    async pushSettings(settings) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('user_settings')
            .upsert({
                user_id: user.id,
                language: settings.language,
                theme: settings.theme,
                last_visit: settings.lastVisit,
                updated_at: new Date().toISOString()
            });
        if (error) console.error('Push Settings Error', error);
    },

    async pushPrayerRecord(date, prayerKey, status) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('prayer_records')
            .upsert({
                user_id: user.id,
                date: date,
                prayer_key: prayerKey,
                status: status,
                timestamp: new Date().toISOString()
            }, { onConflict: 'user_id, date, prayer_key' });
        if (error) console.error('Push Prayer Error', error);
    },

    async deletePrayerRecord(date, prayerKey) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('prayer_records')
            .delete()
            .match({ user_id: user.id, date: date, prayer_key: prayerKey });
        if (error) console.error('Delete Prayer Error', error);
    },

    async pushQadaRecord(qadaItem) {
        if (!authCheck()) return;
        const user = await getUser();
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
        if (error) console.error('Push Qada Error', error);
    },

    async removeQadaRecord(qadaId) {
        if (!authCheck()) return;
        const { error } = await window.supabaseClient.from('qada_prayers').delete().eq('id', qadaId);
        if (error) console.error('Remove Qada Error', error);
    },

    async pushHabit(habit) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient.from('habits').upsert({
            id: habit.id,
            user_id: user.id,
            name: habit.name,
            type: habit.type,
            created_at: new Date(habit.created).toISOString()
        });
        if (error) console.error('Push Habit Error', error);
    },

    async deleteHabit(habitId) {
        if (!authCheck()) return;
        const { error } = await window.supabaseClient.from('habits').delete().eq('id', habitId);
        if (error) console.error('Delete Habit Error', error);
    },

    async pushHabitAction(habitId, date, action) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient.from('habit_history').upsert({
            user_id: user.id,
            habit_id: habitId,
            date: date,
            action: action,
            timestamp: new Date().toISOString()
        }, { onConflict: 'user_id, habit_id, date' });
        if (error) console.error('Push HabitAction Error', error);
    },

    async removeHabitAction(habitId, date) {
        if (!authCheck()) return;
        const { error } = await window.supabaseClient.from('habit_history').delete().match({ habit_id: habitId, date: date });
        if (error) console.error('Remove HabitAction Error', error);
    },

    async pushPoint(amount, reason) {
        if (!authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient.from('points_history').insert({
            user_id: user.id,
            amount: amount,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        if (error) console.error('Push Point Error', error);
    },

    // Legacy support for "Push All" during migration (if needed)
    async pushAllLocalData() {
        console.warn('SyncManager: pushAllLocalData not implemented for massive push. Use live sync.');
        return true;
    }
};

// Helpers
function authCheck() {
    return !!window.supabaseClient.auth.getSession();
}

async function getUser() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
}

window.SyncManager = SyncManager;
