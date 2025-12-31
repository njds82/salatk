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
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return {};

        try {
            const { data, error } = await window.supabaseClient
                .from('prayer_records')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('date', date);

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

        const { data: { session } } = await window.supabaseClient.auth.getSession();
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

    async addQada(originalDate, key, rakaat) {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        try {
            await window.supabaseClient.from('qada_prayers').upsert({
                id: crypto.randomUUID(),
                user_id: session.user.id,
                prayer_key: key,
                original_date: originalDate,
                rakaat: rakaat,
                recorded_at: new Date().toISOString(),
                is_manual: false
            });
        } catch (e) {
            console.error('PrayerService: Error adding Qada', e);
        }
    },

    async removeQada(originalDate, key) {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
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
        const { data: { session } } = await window.supabaseClient.auth.getSession();
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
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        try {
            // This is complex to do purely in cloud without multiple fetches or a stored procedure.
            // For now, we can skip it or do a limited cleanup.
            console.log('PrayerService: Cloud-based cleanupQada starting...');
            const { data: qadas } = await window.supabaseClient.from('qada_prayers').select('*').eq('user_id', session.user.id).is('is_manual', false);

            if (qadas && qadas.length > 0) {
                for (const qada of qadas) {
                    const { data: prayer } = await window.supabaseClient.from('prayer_records')
                        .select('status')
                        .eq('user_id', session.user.id)
                        .eq('date', qada.original_date)
                        .eq('prayer_key', qada.prayer_key)
                        .maybeSingle();

                    if (prayer && prayer.status === 'done') {
                        await window.supabaseClient.from('qada_prayers').delete().eq('id', qada.id);
                    }
                }
            }
        } catch (error) {
            console.error('PrayerService: Error during cloud cleanupQada:', error);
        }
    }
};

window.PrayerService = PrayerService;
