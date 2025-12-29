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

        // Ensure profile exists (Self-Repair)
        await this.ensureProfileExists(session.user);

        try {
            console.group('SyncManager: Pull Operations');

            // 1. Settings
            try {
                const { data: settings, error } = await window.supabaseClient.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
                if (error) throw error;
                if (settings) {
                    await db.settings.bulkPut([
                        { key: 'language', value: settings.language },
                        { key: 'theme', value: settings.theme },
                        { key: 'lastVisit', value: settings.last_visit },
                        { key: 'initialized', value: new Date(settings.initialized_at || Date.now()).getTime() }
                    ]);
                    console.log('✔ Settings synced');
                }
            } catch (e) { console.error('✘ Settings sync failed', e); }

            // 2. Prayers
            try {
                const { data: prayers, error } = await window.supabaseClient.from('prayer_records').select('*').eq('user_id', userId);
                if (error) throw error;
                if (prayers?.length > 0) {
                    const prayerRecords = prayers.map(p => ({
                        date: p.date,
                        key: p.prayer_key,
                        status: p.status,
                        timestamp: new Date(p.recorded_at).getTime()
                    }));
                    await db.prayers.bulkPut(prayerRecords);
                    console.log(`✔ ${prayers.length} Prayers synced`);
                }
            } catch (e) { console.error('✘ Prayers sync failed', e); }

            // 3. Qada
            try {
                const { data: qada, error } = await window.supabaseClient.from('qada_prayers').select('*').eq('user_id', userId);
                if (error) throw error;
                if (qada?.length > 0) {
                    const qadaRecords = qada.map(q => ({
                        id: q.id,
                        prayer: q.prayer_key,
                        date: q.original_date,
                        rakaat: q.rakaat,
                        timestamp: new Date(q.recorded_at).getTime(),
                        manual: q.is_manual
                    }));
                    await db.qada.bulkPut(qadaRecords);
                    console.log(`✔ ${qada.length} Qada records synced`);
                }
            } catch (e) { console.error('✘ Qada sync failed', e); }

            // 4. Habits
            try {
                const { data: habits, error } = await window.supabaseClient.from('habits').select('*').eq('user_id', userId);
                if (error) throw error;
                if (habits?.length > 0) {
                    const habitRecords = habits.map(h => ({
                        id: h.id,
                        name: h.name,
                        type: h.type,
                        created: new Date(h.created_at).getTime()
                    }));
                    await db.habits.bulkPut(habitRecords);
                    console.log(`✔ ${habits.length} Habits synced`);
                }
            } catch (e) { console.error('✘ Habits sync failed', e); }

            // 5. Habit History
            try {
                const { data: habitHistory, error } = await window.supabaseClient.from('habit_history').select('*').eq('user_id', userId);
                if (error) throw error;
                if (habitHistory?.length > 0) {
                    const historyRecords = habitHistory.map(h => ({
                        habitId: h.habit_id,
                        date: h.date,
                        action: h.action
                    }));
                    await db.habit_history.bulkPut(historyRecords);
                    console.log(`✔ ${habitHistory.length} Habit actions synced`);
                }
            } catch (e) { console.error('✘ Habit history sync failed', e); }

            // 6. Points
            try {
                const { data: points, error } = await window.supabaseClient.from('points_history').select('*').eq('user_id', userId);
                if (error) throw error;
                if (points?.length > 0) {
                    // REMOVED: await db.points.clear(); -> This was causing points drain when cloud was empty or partial.
                    const pointRecords = points.map(p => ({
                        // We need to preserve the ID or use a compound key to prevent duplicates if we want pure additive,
                        // but since Dexie has auto-increment '++id', mapping without ID or with cloud ID is better.
                        // For now, let's just push them in. bulkPut usually needs a primary key.
                        // the Dexie schema for points is '++id, timestamp'.
                        // If we don't have a stable ID from cloud, we might get duplicates on every pull.
                        // Let's assume 'recorded_at' (timestamp) is unique enough for a basic check or just use bulkPut if we had IDs.
                        id: p.id, // Using the ID from Supabase (assuming it's compatible or we are syncing it)
                        amount: p.amount,
                        reason: p.reason,
                        timestamp: new Date(p.recorded_at).getTime()
                    }));
                    await db.points.bulkPut(pointRecords);
                    console.log(`✔ ${points.length} Points synced (Additive)`);
                }
            } catch (e) { console.error('✘ Points sync failed', e); }

            // 7. Location
            try {
                const { data: location, error } = await window.supabaseClient.from('locations').select('*').eq('user_id', userId).maybeSingle();
                if (error) throw error;
                if (location) {
                    const locData = {
                        id: 'user_location',
                        lat: location.latitude,
                        long: location.longitude,
                        manualMode: location.is_manual_mode,
                        lastUpdate: new Date(location.last_update).getTime()
                    };
                    await db.locations.put(locData);

                    // Sync to localStorage for PrayerManager (Legacy/Sync fallback)
                    localStorage.setItem('salatk_prayer_location', JSON.stringify({
                        lat: location.latitude,
                        long: location.longitude,
                        name: location.name || '',
                        manualMode: location.is_manual_mode,
                        lastUpdate: locData.lastUpdate
                    }));

                    console.log('✔ Location synced (DB + LocalStorage)');
                }
            } catch (e) { console.error('✘ Location sync failed', e); }

            console.groupEnd();
            console.log('SyncManager: Pull complete.');
            return true;

        } catch (error) {
            console.groupEnd();
            console.error('SyncManager: Fatal pull error', error);
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
        if (error) {
            console.error('Push Settings Error', error.message || error);
        }
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
            }, { onConflict: 'user_id,date,prayer_key' });
        if (error) {
            console.error('Push Prayer Error', error.message || error);
        }
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
        if (error) {
            console.error('Push Qada Error', error.message || error);
        }
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
        if (error) {
            console.error('Push Point Error', error.message || error);
        }
    },

    // Push all local data to cloud (Force Sync / Recovery)
    async pushAllLocalData() {
        if (!await authCheck()) {
            console.warn('SyncManager: Cannot push, not logged in');
            return false;
        }

        try {
            console.group('SyncManager: Push Operations');
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) await this.ensureProfileExists(session.user);

            const user = await getUser();

            // 1. Settings
            const allSettings = await db.settings.toArray();
            if (allSettings.length > 0) {
                const settingsObj = {};
                allSettings.forEach(s => settingsObj[s.key] = s.value);

                const { error } = await window.supabaseClient.from('user_settings').upsert({
                    user_id: user.id,
                    language: settingsObj.language || 'ar',
                    theme: settingsObj.theme || 'light',
                    last_visit: settingsObj.lastVisit || new Date().toISOString().split('T')[0]
                });
                if (error) {
                    console.error('✘ Settings push failed', error);
                    console.dir(error);
                }
                else console.log('✔ Settings pushed');
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
                for (let i = 0; i < prayerUpdates.length; i += 50) {
                    const { error } = await window.supabaseClient.from('prayer_records').upsert(prayerUpdates.slice(i, i + 50), { onConflict: 'user_id,date,prayer_key' });
                    if (error) {
                        console.error('✘ Prayers chunk push failed', error.message || error);
                    }
                }
                console.log(`✔ ${prayerUpdates.length} Prayers pushed`);
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
                const { error } = await window.supabaseClient.from('qada_prayers').upsert(qadaUpdates);
                if (error) {
                    console.error('✘ Qada push failed', error);
                    console.dir(error);
                }
                else console.log(`✔ ${qadaUpdates.length} Qada records pushed`);
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
                const { error } = await window.supabaseClient.from('habits').upsert(habitUpdates);
                if (error) console.error('✘ Habits push failed', error);
                else console.log(`✔ ${habitUpdates.length} Habits pushed`);
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
                    const { error } = await window.supabaseClient.from('habit_history').upsert(historyUpdates.slice(i, i + 50), { onConflict: 'user_id, habit_id, date' });
                    if (error) console.error('✘ Habit history chunk failed', error);
                }
                console.log(`✔ ${historyUpdates.length} Habit actions pushed`);
            }

            // 6. Points
            const allPoints = await db.points.toArray();
            if (allPoints.length > 0) {
                const pointUpdates = allPoints.map(p => ({
                    user_id: user.id,
                    amount: p.amount,
                    reason: p.reason,
                    recorded_at: new Date(p.timestamp || Date.now()).toISOString()
                }));
                const { error } = await window.supabaseClient.from('points_history').insert(pointUpdates);
                if (error) {
                    console.error('✘ Points push failed', error);
                    console.dir(error);
                }
                else console.log(`✔ ${pointUpdates.length} Points pushed`);
            }

            // 7. Location
            const location = await db.locations.get('user_location');
            if (location) {
                const { error } = await window.supabaseClient.from('locations').upsert({
                    user_id: user.id,
                    latitude: location.lat,
                    longitude: location.long,
                    is_manual_mode: location.manualMode,
                    last_update: new Date(location.lastUpdate).toISOString()
                });
                if (error) console.error('✘ Location push failed', error);
                else console.log('✔ Location pushed');
            }

            console.groupEnd();
            console.log('SyncManager: Push complete.');
            return true;

        } catch (error) {
            console.groupEnd();
            console.error('SyncManager: Fatal push error', error);
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
                    if (window.currentPage === 'daily-prayers' && window.updatePrayerCard) {
                        updatePrayerCard(eventType === 'DELETE' ? oldRecord.prayer_key : newRecord.prayer_key);
                    }
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
                    if (window.currentPage === 'qada-prayers' && window.refreshQadaList) {
                        refreshQadaList();
                    }
                    break;
                case 'habits':
                    if (eventType === 'DELETE') {
                        await db.habits.delete(oldRecord.id);
                        if (window.currentPage === 'habits' && window.navigateTo) navigateTo('habits');
                    } else {
                        await db.habits.put({
                            id: newRecord.id,
                            name: newRecord.name,
                            type: newRecord.type,
                            created: new Date(newRecord.created_at).getTime()
                        });
                        if (window.currentPage === 'habits' && window.updateHabitCard) updateHabitCard(newRecord.id);
                    }
                    break;
                case 'habit_history':
                    if (eventType === 'DELETE') {
                        await db.habit_history.delete([oldRecord.habit_id, oldRecord.date]);
                        if (window.currentPage === 'habits' && window.updateHabitCard) updateHabitCard(oldRecord.habit_id);
                    } else {
                        await db.habit_history.put({
                            habitId: newRecord.habit_id,
                            date: newRecord.date,
                            action: newRecord.action
                        });
                        if (window.currentPage === 'habits' && window.updateHabitCard) updateHabitCard(newRecord.id);
                    }
                    break;
                case 'user_settings':
                    if (eventType !== 'DELETE') {
                        const oldLang = getCurrentLanguage();
                        await db.settings.bulkPut([
                            { key: 'language', value: newRecord.language },
                            { key: 'theme', value: newRecord.theme }
                        ]);
                        if (newRecord.theme) handleThemeChange(newRecord.theme);
                        if (newRecord.language && newRecord.language !== oldLang) {
                            setLanguage(newRecord.language);
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
    },
    async diagnoseSync() {
        console.group('%c Sync Diagnostics ', 'background: #222; color: #bada55; font-size: 1.2em');

        try {
            // 1. Connection Check
            console.log('1. Checking SDK...');
            if (!window.supabaseClient) {
                console.error('✘ Supabase SDK not initialized.');
                return;
            }
            console.log('✔ SDK Initialized');

            // 2. Auth Check
            console.log('2. Checking Auth...');
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                console.error('✘ No active session. Please log in.');
                return;
            }
            console.log('✔ Logged in as:', session.user.email);
            const userId = session.user.id;

            // 3. Permissions Check (Profile)
            console.log('3. Checking Profile Access...');
            const { data: profile, error: pError } = await window.supabaseClient.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (pError) console.error('✘ Profile access error:', pError.message);
            else if (!profile) console.warn('⚠ Profile record missing in cloud!');
            else console.log('✔ Profile access OK');

            // 4. Table Health Check
            const tables = ['user_settings', 'prayer_records', 'qada_prayers', 'habits', 'habit_history', 'points_history', 'locations'];
            console.log('4. Checking Table Permissions...');
            for (const table of tables) {
                const { error } = await window.supabaseClient.from(table).select('count').limit(1);
                if (error) console.error(`  ✘ ${table}: ${error.message}`);
                else console.log(`  ✔ ${table}: Accessible`);
            }

            // 5. Local Data Audit
            console.log('5. Local Data Audit...');
            const localCounts = {
                prayers: await db.prayers.count(),
                qada: await db.qada.count(),
                points: await db.points.count(),
                habits: await db.habits.count()
            };
            console.table(localCounts);

        } catch (err) {
            console.error('Diagnostic failed with unexpected error:', err);
        } finally {
            console.groupEnd();
        }
    },

    // Helper: Ensure profile record exists
    async ensureProfileExists(user) {
        try {
            const { data: profile, error } = await window.supabaseClient
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is unexpected but maybeSingle usually handles it.

            if (!profile) {
                console.warn('SyncManager: Profile missing, attempting self-repair...');
                await window.supabaseClient.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || 'User'
                });
                console.log('✔ Profile repaired');
            }
        } catch (e) {
            console.error('SyncManager: Profile repair failed', e);
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
