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
        // Fetch all prayers for this date from IndexedDB
        const records = await db.prayers.where({ date: date }).toArray();

        // Convert array to object map: { fajr: { status: 'done', ... }, ... }
        const prayerMap = {};
        records.forEach(r => {
            prayerMap[r.key] = r;
        });

        return prayerMap;
    },

    // Mark prayer status
    async markPrayer(key, date, status) {
        if (!key || !date) {
            console.error('PrayerService: Missing key or date', { key, date });
            return { success: false, message: 'missing_params' };
        }
        const prayerDef = PRAYERS[key];
        if (!prayerDef) throw new Error('Invalid prayer key');

        const existing = await db.prayers.get({ date: date, key: key });

        // If status is same, do nothing
        if (existing && existing.status === status) {
            return { success: false, message: 'no_change' };
        }

        // Logic for points needs to be handled.
        // If changing status, we might need to revert previous points.
        // Ideally PointsService handles this, but for now we'll do it here alongside DB updates.

        let pointsChange = 0;
        let reason = '';

        // 1. Revert previous calculations
        if (existing) {
            if (existing.status === 'done') {
                pointsChange -= prayerDef.points; // Remove points
            } else if (existing.status === 'missed' && prayerDef.required) {
                pointsChange += prayerDef.points; // Give back penalty
                // Also remove Qada if it exists
                await this.removeQada(date, key);
            }
        }

        // 2. Apply new status calculations
        if (status === 'done') {
            pointsChange += prayerDef.points;
            reason = `${t(prayerDef.nameKey)} - ${t('performed')}`;
        } else if (status === 'missed') {
            if (prayerDef.required) {
                // NEW: Idempotency Check
                // Before penalizing, check if we already penalized for this prayer today.
                const checkReason = `${t(prayerDef.nameKey)} - ${t('missed')}`;
                const startOfDay = new Date(date + 'T00:00:00').getTime();
                const dailyPoints = await db.points.where('timestamp').above(startOfDay).toArray();
                const alreadyPenalized = dailyPoints.some(p => p.reason === checkReason && p.amount < 0);

                if (!alreadyPenalized) {
                    pointsChange -= prayerDef.points;
                    reason = checkReason;
                    // Add Qada
                    await this.addQada(date, key, prayerDef.rakaat);
                } else {
                    console.log('PrayerService: Skipping duplicate penalty for', checkReason);
                }
            }
        }

        // Update DB
        await db.prayers.put({
            date: date,
            key: key,
            status: status,
            timestamp: Date.now()
        });

        // Update Points
        if (pointsChange !== 0) {
            await PointsService.addPoints(pointsChange, reason);
        }

        // Trigger Sync (Fire and forget, or managed by caller?)
        // Better to have SyncManager listen or be called explicitly.
        // We will call SyncManager here to maintain current behavior.
        if (window.SyncManager) {
            SyncManager.pushPrayerRecord(date, key, status);
        }

        return { success: true };
    },

    async addQada(originalDate, key, rakaat) {
        const qadaItem = {
            id: crypto.randomUUID(),
            prayer: key,
            date: originalDate,
            rakaat: rakaat,
            timestamp: Date.now(),
            manual: false
        };
        await db.qada.add(qadaItem);
        if (window.SyncManager) SyncManager.pushQadaRecord(qadaItem);
    },

    async removeQada(originalDate, key) {
        const qada = await db.qada.where({ date: originalDate, prayer: key }).first();
        if (qada) {
            await db.qada.delete(qada.id);
            if (window.SyncManager) SyncManager.removeQadaRecord(qada.id);
        }
    },

    // Reset prayer status (undo decision)
    async resetPrayer(key, date) {
        const existing = await db.prayers.get({ date: date, key: key });
        if (!existing) return { success: false, message: 'no_record' };

        const prayerDef = PRAYERS[key];
        let pointsChange = 0;

        // Revert previous points
        if (existing.status === 'done') {
            pointsChange -= prayerDef.points;
        } else if (existing.status === 'missed' && prayerDef.required) {
            pointsChange += prayerDef.points;
            // Remove qada entry
            await this.removeQada(date, key);
        }

        // Delete the prayer record
        await db.prayers.delete([date, key]);

        // Update points
        if (pointsChange !== 0) {
            await PointsService.addPoints(pointsChange, `${t('reset_decision')} - ${t(prayerDef.nameKey)}`);
        }

        // Sync
        if (window.SyncManager) {
            SyncManager.deletePrayerRecord(date, key);
        }

        return { success: true };
    }
};

window.PrayerService = PrayerService;
