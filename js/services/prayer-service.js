// ========================================
// Prayer Service
// ========================================

const PRAYERS = {
    fajr: { nameKey: 'fajr', rakaat: 2, points: 5, required: true },
    duha: { nameKey: 'duha', rakaat: 2, points: 3, required: false },
    dhuhr: { nameKey: 'dhuhr', rakaat: 4, points: 5, required: true },
    asr: { nameKey: 'asr', rakaat: 4, points: 5, required: true },
    maghrib: { nameKey: 'maghrib', rakaat: 3, points: 5, required: true },
    isha: { nameKey: 'isha', rakaat: 4, points: 5, required: true },
    qiyam: { nameKey: 'qiyam', rakaat: 0, points: 3, required: false }
};

const PrayerService = {
    // Get prayer definitions
    getDefinitions() {
        return PRAYERS;
    },

    // Get prayers for a specific date
    async getDailyPrayers(date) {
        if (!window.supabaseClient) return {};
        const session = await window.AuthManager.getSession();
        if (!session) return {};

        try {
            const { data, error } = await withTimeout(
                window.supabaseClient
                    .from('prayer_records')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('date', date),
                8000,
                { data: [], error: 'timeout' }
            );

            if (error) throw error;

            const prayerMap = {};
            (data || []).forEach(r => {
                prayerMap[r.prayer_key] = {
                    key: r.prayer_key,
                    status: r.status,
                    timestamp: new Date(r.recorded_at).getTime()
                };
            });

            return prayerMap;
        } catch (e) {
            console.error('PrayerService: Failed to fetch daily prayers', e);
            return {};
        }
    },

    // Mark prayer status
    async markPrayer(key, date, status) {
        if (!key || !date || !window.supabaseClient) {
            console.error('PrayerService: Missing params', { key, date });
            return { success: false };
        }

        const session = await window.AuthManager.getSession();
        if (!session) return { success: false };

        const prayerDef = PRAYERS[key];
        const pointId = `prayer:${date}:${key}`;
        let pointsAmount = 0;
        let reason = `${t(prayerDef.nameKey)} - ${t(status === 'done' ? 'performed' : 'missed')}`;

        if (status === 'done') {
            pointsAmount = prayerDef.points;
            if (prayerDef.required) await this.removeQada(date, key);
        } else if (status === 'missed' && prayerDef.required) {
            pointsAmount = -prayerDef.points;
            await this.addQada(date, key, prayerDef.rakaat);
        } else {
            if (prayerDef.required) await this.removeQada(date, key);
        }

        try {
            // Check current status
            const { data: currentRecord } = await window.supabaseClient
                .from('prayer_records')
                .select('status')
                .eq('user_id', session.user.id)
                .eq('date', date)
                .eq('prayer_key', key)
                .maybeSingle();

            if (currentRecord && currentRecord.status === status) {
                console.log(`PrayerService: skipping markPrayer, status already ${status}`);
                return { success: true };
            }

            // Update Cloud
            const { error: prayerError } = await window.supabaseClient
                .from('prayer_records')
                .upsert({
                    user_id: session.user.id,
                    date: date,
                    prayer_key: key,
                    status: status,
                    recorded_at: new Date().toISOString()
                }, { onConflict: 'user_id,date,prayer_key' });

            if (prayerError) throw prayerError;

            // Update Points
            await PointsService.addPoints(pointsAmount, reason, pointId);

            return { success: true };
        } catch (e) {
            console.error('PrayerService: Error marking prayer', e);
            return { success: false };
        }
    },

    async addQada(originalDate, key, rakaat, isManual = false) {
        if (!window.supabaseClient) return;
        const session = await window.AuthManager.getSession();
        if (!session) return;

        try {
            await window.supabaseClient.from('qada_prayers').upsert({
                id: crypto.randomUUID(),
                user_id: session.user.id,
                prayer_key: key,
                original_date: originalDate || null,
                rakaat: rakaat,
                recorded_at: new Date().toISOString(),
                is_manual: isManual
            }, { onConflict: 'user_id,original_date,prayer_key' });
        } catch (e) {
            console.error('PrayerService: Error adding Qada', e);
        }
    },

    async getQadaPrayers() {
        if (!window.supabaseClient) return [];
        const session = await window.AuthManager.getSession();
        if (!session) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('qada_prayers')
                .select('*')
                .eq('user_id', session.user.id)
                .order('recorded_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(r => ({
                id: r.id,
                prayer: r.prayer_key,
                date: r.original_date,
                rakaat: r.rakaat,
                timestamp: new Date(r.recorded_at).getTime(),
                manual: r.is_manual
            }));
        } catch (e) {
            console.error('PrayerService: Failed to fetch Qada prayers', e);
            return [];
        }
    },

    async makeUpQada(qadaId) {
        if (!window.supabaseClient) return { success: false };

        try {
            // First get the record to know what points to add
            const { data: qada, error: fetchError } = await window.supabaseClient
                .from('qada_prayers')
                .select('*')
                .eq('id', qadaId)
                .single();

            if (fetchError || !qada) return { success: false };

            // Update original record status if date is known
            if (qada.original_date) {
                const { error: recordError } = await window.supabaseClient
                    .from('prayer_records')
                    .upsert({
                        user_id: qada.user_id,
                        date: qada.original_date,
                        prayer_key: qada.prayer_key,
                        status: 'done',
                        recorded_at: new Date().toISOString()
                    }, { onConflict: 'user_id,date,prayer_key' });

                if (recordError) console.warn('PrayerService: could not update prayer_record', recordError);
            }

            // Delete the record
            const { error: deleteError } = await window.supabaseClient
                .from('qada_prayers')
                .delete()
                .eq('id', qadaId);

            if (deleteError) throw deleteError;

            // Add points
            await PointsService.addPoints(3, t('made_up') + ' (' + t(PRAYERS[qada.prayer_key].nameKey) + ')', `qada:${qadaId}`);

            return { success: true };
        } catch (e) {
            console.error('PrayerService: Error making up Qada', e);
            return { success: false };
        }
    },

    async deleteQada(qadaId) {
        if (!window.supabaseClient) return { success: false };
        try {
            await window.supabaseClient.from('qada_prayers').delete().eq('id', qadaId);
            return { success: true };
        } catch (e) {
            console.error('PrayerService: Error deleting Qada', e);
            return { success: false };
        }
    },

    async removeQada(originalDate, key) {
        if (!window.supabaseClient) return;
        const session = await window.AuthManager.getSession();
        if (!session) return;

        try {
            await window.supabaseClient.from('qada_prayers')
                .delete()
                .eq('user_id', session.user.id)
                .eq('original_date', originalDate)
                .eq('prayer_key', key);
        } catch (e) {
            console.error('PrayerService: Error removing Qada', e);
        }
    },

    // Reset prayer status (undo decision)
    async resetPrayer(key, date) {
        if (!window.supabaseClient) return { success: false };
        const session = await window.AuthManager.getSession();
        if (!session) return { success: false };

        const prayerDef = PRAYERS[key];
        const pointId = `prayer:${date}:${key}`;

        try {
            if (prayerDef.required) await this.removeQada(date, key);

            await window.supabaseClient.from('prayer_records')
                .delete()
                .eq('user_id', session.user.id)
                .eq('date', date)
                .eq('prayer_key', key);

            await PointsService.addPoints(0, `Reset ${key}`, pointId);

            return { success: true };
        } catch (e) {
            console.error('PrayerService: Error resetting prayer', e);
            return { success: false };
        }
    },

    // Clean up ghost Qada records (prayers marked as done but still in Qada list)
    async cleanupQada() {
        if (!window.supabaseClient) return;
        const session = await window.AuthManager.getSession();
        if (!session) return;

        try {
            console.log('PrayerService: Cloud-based cleanupQada starting...');
            // Fetch all non-manual qada prayers
            const { data: qadas } = await window.supabaseClient
                .from('qada_prayers')
                .select('id, original_date, prayer_key')
                .eq('user_id', session.user.id)
                .is('is_manual', false);

            if (!qadas || qadas.length === 0) return;

            // Group dates to fetch relevant prayer records in one go
            const uniqueDates = [...new Set(qadas.filter(q => q.original_date).map(q => q.original_date))];

            if (uniqueDates.length === 0) return;

            // Fetch all "done" prayer records for these dates
            const { data: doneRecords } = await window.supabaseClient
                .from('prayer_records')
                .select('date, prayer_key')
                .eq('user_id', session.user.id)
                .eq('status', 'done')
                .in('date', uniqueDates);

            const doneSet = new Set((doneRecords || []).map(r => `${r.date}:${r.prayer_key}`));

            // Identify qada records that should be deleted
            const idsToDelete = qadas
                .filter(q => q.original_date && doneSet.has(`${q.original_date}:${q.prayer_key}`))
                .map(q => q.id);

            if (idsToDelete.length > 0) {
                console.log(`PrayerService: Cleaning up ${idsToDelete.length} redundant Qada records`);
                await window.supabaseClient
                    .from('qada_prayers')
                    .delete()
                    .in('id', idsToDelete);
            }
        } catch (error) {
            console.error('PrayerService: Error during cloud cleanupQada:', error);
        }
    },

    // Get prayer streak (consecutive days)
    async getPrayerStreak() {
        if (!window.supabaseClient) return 0;
        const session = await window.AuthManager.getSession();
        if (!session) return 0;

        try {
            // Fetch records for the last year (or a reasonable chunk)
            const { data: records, error } = await window.supabaseClient
                .from('prayer_records')
                .select('date, status')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (!records || records.length === 0) return 0;

            // Group by date to see if day is "active"
            const dailyActivity = {};
            records.forEach(r => {
                if (!dailyActivity[r.date]) dailyActivity[r.date] = false;
                if (r.status === 'done') dailyActivity[r.date] = true;
            });

            let streak = 0;
            const today = getCurrentDate();
            let checkDate = parseDate(today);

            for (let i = 0; i < 365; i++) {
                const dateStr = formatDate(checkDate);
                // If it's today and not yet prayed, we might still be in a streak if yesterday was fine
                // But for simplicity, we'll check if ANY prayer was done that day.
                if (dailyActivity[dateStr]) {
                    streak++;
                } else {
                    // If it's today and nothing done yet, don't break streak immediately?
                    // Usually, streaks only break if a FULL DAY is missed.
                    if (dateStr === today) {
                        // Keep going to check yesterday
                    } else {
                        break;
                    }
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }

            return streak;
        } catch (e) {
            console.error('PrayerService: Error calculating streak', e);
            return 0;
        }
    }
};

window.PrayerService = PrayerService;
