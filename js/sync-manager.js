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
                window.supabaseClient.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
                window.supabaseClient.from('prayer_records').select('*').eq('user_id', userId),
                window.supabaseClient.from('qada_prayers').select('*').eq('user_id', userId),
                window.supabaseClient.from('habits').select('*').eq('user_id', userId),
                window.supabaseClient.from('habit_history').select('*').eq('user_id', userId),
                window.supabaseClient.from('points_history').select('*').eq('user_id', userId),
                window.supabaseClient.from('locations').select('*').eq('user_id', userId).maybeSingle()
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
                    timestamp: new Date(p.recorded_at).getTime()
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
                    timestamp: new Date(q.recorded_at).getTime(),
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
                    timestamp: new Date(p.recorded_at).getTime() // We lose original ordering ID unless we sort
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
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('user_settings')
            .upsert({
                user_id: user.id,
                language: settings.language,
                theme: settings.theme,
                last_visit: settings.lastVisit
            });
        if (error) console.error('Push Settings Error', error);
    },

    async pushPrayerRecord(date, prayerKey, status) {
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('prayer_records')
            .upsert({
                user_id: user.id,
                date: date,
                prayer_key: prayerKey,
                status: status,
                recorded_at: new Date().toISOString()
            }, { onConflict: 'user_id, date, prayer_key' });
        if (error) console.error('Push Prayer Error', error);
    },

    async deletePrayerRecord(date, prayerKey) {
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('prayer_records')
            .delete()
            .match({ user_id: user.id, date: date, prayer_key: prayerKey });
        if (error) console.error('Delete Prayer Error', error);
    },

    async pushQadaRecord(qadaItem) {
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient
            .from('qada_prayers')
            .upsert({
                id: qadaItem.id,
                user_id: user.id,
                prayer_key: qadaItem.prayer,
                original_date: qadaItem.date,
                rakaat: qadaItem.rakaat,
                recorded_at: new Date(qadaItem.timestamp).toISOString(),
                is_manual: qadaItem.manual || false,
                is_made_up: false
            });
        if (error) console.error('Push Qada Error', error);
    },

    async removeQadaRecord(qadaId) {
        if (!await authCheck()) return;
        const { error } = await window.supabaseClient.from('qada_prayers').delete().eq('id', qadaId);
        if (error) console.error('Remove Qada Error', error);
    },

    async pushHabit(habit) {
        if (!await authCheck()) return;
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
        if (!await authCheck()) return;
        const { error } = await window.supabaseClient.from('habits').delete().eq('id', habitId);
        if (error) console.error('Delete Habit Error', error);
    },

    async pushHabitAction(habitId, date, action) {
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient.from('habit_history').upsert({
            user_id: user.id,
            habit_id: habitId,
            date: date,
            action: action,
            recorded_at: new Date().toISOString()
        }, { onConflict: 'user_id, habit_id, date' });
        if (error) console.error('Push HabitAction Error', error);
    },

    async removeHabitAction(habitId, date) {
        if (!await authCheck()) return;
        const { error } = await window.supabaseClient.from('habit_history').delete().match({ habit_id: habitId, date: date });
        if (error) console.error('Remove HabitAction Error', error);
    },

    async pushPoint(amount, reason) {
        if (!await authCheck()) return;
        const user = await getUser();
        const { error } = await window.supabaseClient.from('points_history').insert({
            user_id: user.id,
            amount: amount,
            reason: reason,
            recorded_at: new Date().toISOString()
        });
        if (error) console.error('Push Point Error', error);
    },

    // Push all local data to cloud (Force Sync / Recovery)
    async pushAllLocalData() {
        if (!await authCheck()) {
            console.warn('SyncManager: Cannot push, not logged in');
            return false;
        }

        console.log('SyncManager: Pushing all local data...');
        const user = await getUser();

        try {
            // 1. Settings
            const allSettings = await db.settings.toArray();
            if (allSettings.length > 0) {
                const settingsObj = {};
                allSettings.forEach(s => settingsObj[s.key] = s.value);

                await window.supabaseClient.from('user_settings').upsert({
                    user_id: user.id,
                    language: settingsObj.language || 'ar',
                    theme: settingsObj.theme || 'light',
                    last_visit: settingsObj.lastVisit || new Date().toISOString().split('T')[0]
                });
            }

            // 2. Prayers
            const allPrayers = await db.prayers.toArray();
            if (allPrayers.length > 0) {
                const prayerUpdates = allPrayers.map(p => ({
                    user_id: user.id,
                    date: p.date,
                    prayer_key: p.key,
                    status: p.status,
                    recorded_at: new Date(p.timestamp || Date.now()).toISOString()
                }));
                // Process in chunks of 50 to avoid payload limits
                for (let i = 0; i < prayerUpdates.length; i += 50) {
                    const chunk = prayerUpdates.slice(i, i + 50);
                    await window.supabaseClient
                        .from('prayer_records')
                        .upsert(chunk, { onConflict: 'user_id, date, prayer_key' });
                }
            }

            // 3. Qada
            const allQada = await db.qada.toArray();
            if (allQada.length > 0) {
                const qadaUpdates = allQada.map(q => ({
                    id: q.id,
                    user_id: user.id,
                    prayer_key: q.prayer,
                    original_date: q.date,
                    rakaat: q.rakaat,
                    recorded_at: new Date(q.timestamp || Date.now()).toISOString(),
                    is_manual: q.manual || false,
                    is_made_up: false
                }));
                for (let i = 0; i < qadaUpdates.length; i += 50) {
                    await window.supabaseClient.from('qada_prayers').upsert(qadaUpdates.slice(i, i + 50));
                }
            }

            // 4. Habits
            const allHabits = await db.habits.toArray();
            if (allHabits.length > 0) {
                const habitUpdates = allHabits.map(h => ({
                    id: h.id,
                    user_id: user.id,
                    name: h.name,
                    type: h.type,
                    created_at: new Date(h.created || Date.now()).toISOString()
                }));
                await window.supabaseClient.from('habits').upsert(habitUpdates);
            }

            // 5. Habit History
            const allHabitHistory = await db.habit_history.toArray();
            if (allHabitHistory.length > 0) {
                const historyUpdates = allHabitHistory.map(h => ({
                    user_id: user.id,
                    habit_id: h.habitId,
                    date: h.date,
                    action: h.action,
                    recorded_at: new Date().toISOString()
                }));
                for (let i = 0; i < historyUpdates.length; i += 50) {
                    await window.supabaseClient
                        .from('habit_history')
                        .upsert(historyUpdates.slice(i, i + 50), { onConflict: 'user_id, habit_id, date' });
                }
            }

            // 6. Location
            const location = await db.locations.get('user_location');
            if (location) {
                await window.supabaseClient.from('locations').upsert({
                    user_id: user.id,
                    latitude: location.lat,
                    longitude: location.long,
                    is_manual_mode: location.manualMode,
                    last_update: new Date(location.lastUpdate).toISOString()
                });
            }

            console.log('SyncManager: Push complete.');
            return true;

        } catch (error) {
            console.error('SyncManager: Push failed', error);
            return false;
        }
    },
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
                    console.log('Realtime Change:', payload);
                    await this.handleRealtimeEvent(payload);
                }
            )
            .subscribe((status) => {
                console.log('Realtime Subscription Status:', status);
            });
    },

    async handleRealtimeEvent(payload) {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;

        // We only care about ensuring our local DB matches cloud.
        // Identify table and update IndexedDB.

        try {
            switch (table) {
                case 'prayer_records':
                    if (eventType === 'DELETE') {
                        await db.prayers.delete([oldRecord.date, oldRecord.prayer_key]);
                    } else {
                        await db.prayers.put({
                            date: newRecord.date,
                            key: newRecord.prayer_key,
                            status: newRecord.status,
                            timestamp: new Date(newRecord.recorded_at).getTime()
                        });
                    }
                    if (window.currentPage === 'daily-prayers') renderPage('daily-prayers');
                    break;

                case 'qada_prayers':
                    if (eventType === 'DELETE') {
                        await db.qada.delete(oldRecord.id);
                    } else {
                        await db.qada.put({
                            id: newRecord.id,
                            prayer: newRecord.prayer_key,
                            date: newRecord.original_date,
                            rakaat: newRecord.rakaat,
                            timestamp: new Date(newRecord.recorded_at).getTime(),
                            manual: newRecord.is_manual
                        });
                    }
                    if (window.currentPage === 'qada-prayers') renderPage('qada-prayers');
                    break;

                case 'habits':
                    if (eventType === 'DELETE') {
                        await db.habits.delete(oldRecord.id);
                    } else {
                        await db.habits.put({
                            id: newRecord.id,
                            name: newRecord.name,
                            type: newRecord.type,
                            created: new Date(newRecord.created_at).getTime()
                        });
                    }
                    if (window.currentPage === 'habits') renderPage('habits');
                    break;

                case 'habit_history':
                    if (eventType === 'DELETE') {
                        await db.habit_history.delete([oldRecord.habit_id, oldRecord.date]);
                    } else {
                        await db.habit_history.put({
                            habitId: newRecord.habit_id,
                            date: newRecord.date,
                            action: newRecord.action
                        });
                    }
                    if (window.currentPage === 'habits') renderPage('habits');
                    break;

                case 'user_settings':
                    if (eventType !== 'DELETE') {
                        await db.settings.bulkPut([
                            { key: 'language', value: newRecord.language },
                            { key: 'theme', value: newRecord.theme }
                        ]);
                        // Apply immediately if needed
                        if (newRecord.theme) handleThemeChange(newRecord.theme);
                        if (newRecord.language && newRecord.language !== getCurrentLanguage()) {
                            setLanguage(newRecord.language);
                            renderPage(window.currentPage);
                        }
                    }
                    break;

                case 'points_history':
                    // Points are additive logs. 
                    // Best strategy for realtime points: Just re-pull or add the new record?
                    // Pulling total is safer but expensive.
                    // Let's just update points display globally.
                    if (window.PointsService) {
                        const total = await window.PointsService.getTotal();
                        // This is local total, we might need to invalidate cache?
                        // PointsService calculates from db.points.
                        // So we must insert into db.points.
                        if (eventType === 'INSERT') {
                            await db.points.add({
                                amount: newRecord.amount,
                                reason: newRecord.reason,
                                timestamp: new Date(newRecord.recorded_at).getTime()
                            });
                        }
                        updatePointsDisplay();
                    }
                    break;
            }
        } catch (err) {
            console.error('Error handling realtime event:', err);
        }
    }
};

// Helpers
async function authCheck() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return !!session;
}

async function getUser() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
}

window.SyncManager = SyncManager;
