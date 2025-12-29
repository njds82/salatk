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

        // Logic for points needs to be handled via Deterministic IDs
        const pointId = `prayer:${date}:${key}`;
        let pointsAmount = 0;
        let reason = `${t(prayerDef.nameKey)} - ${t(status === 'done' ? 'performed' : 'missed')}`;

        if (status === 'done') {
            pointsAmount = prayerDef.points;
            // If it was previously missed, remove from Qada
            if (existing && existing.status === 'missed' && prayerDef.required) {
                await this.removeQada(date, key);
            }
        } else if (status === 'missed' && prayerDef.required) {
            pointsAmount = -prayerDef.points;
            // Add Qada if missing
            await this.addQada(date, key, prayerDef.rakaat);
        } else {
            // If status is 'none' (reset) or optional missed, we just remove points for this ID
            pointsAmount = 0;
            if (existing && existing.status === 'missed' && prayerDef.required) {
                await this.removeQada(date, key);
            }
        }

        // Update DB
        await db.prayers.put({
            date: date,
            key: key,
            status: status,
            timestamp: Date.now()
        });

        // Update Points with deterministic ID
        // If pointsAmount is 0, addPoints handles deletion
        await PointsService.addPoints(pointsAmount, reason, pointId);

        // Trigger Sync
        if (window.SyncManager) {
            await SyncManager.pushPrayerRecord(date, key, status);
        }

        return { success: true };
    },

    async addQada(originalDate, key, rakaat) {
        // Check if already exists to avoid duplicates
        const existing = await db.qada.where({ date: originalDate, prayer: key }).first();
        if (existing) return;

        const qadaItem = {
            id: crypto.randomUUID(),
            prayer: key,
            date: originalDate,
            rakaat: rakaat,
            timestamp: Date.now(),
            manual: false
        };
        await db.qada.add(qadaItem);
        if (window.SyncManager) await SyncManager.pushQadaRecord(qadaItem);
    },

    async removeQada(originalDate, key) {
        const qada = await db.qada.where({ date: originalDate, prayer: key }).first();
        if (qada) {
            await db.qada.delete(qada.id);
            if (window.SyncManager) await SyncManager.removeQadaRecord(qada.id);
        }
    },

    // Reset prayer status (undo decision)
    async resetPrayer(key, date) {
        const existing = await db.prayers.get({ date: date, key: key });
        if (!existing) return { success: false, message: 'no_record' };

        const prayerDef = PRAYERS[key];
        const pointId = `prayer:${date}:${key}`;

        // If it was missed and required, remove Qada
        if (existing.status === 'missed' && prayerDef.required) {
            await this.removeQada(date, key);
        }

        // Delete the prayer record
        await db.prayers.delete([date, key]);

        // Remove points (amount 0 + ID = delete)
        await PointsService.addPoints(0, `Reset ${key}`, pointId);

        // Sync
        if (window.SyncManager) {
            await SyncManager.deletePrayerRecord(date, key);
        }

        return { success: true };
    },

    // Clean up ghost Qada records (prayers marked as done but still in Qada list)
    async cleanupQada() {
        try {
            const qadaRecords = await db.qada.toArray();
            let cleanedCount = 0;
            for (const qada of qadaRecords) {
                if (qada.date === 'unknown' || qada.manual) continue;

                const prayer = await db.prayers.get({ date: qada.date, key: qada.prayer });
                if (prayer && prayer.status === 'done') {
                    await db.qada.delete(qada.id);
                    if (window.SyncManager) await SyncManager.removeQadaRecord(qada.id);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                console.log(`PrayerService: Cleaned up ${cleanedCount} ghost Qada records.`);
            }
        } catch (error) {
            console.error('PrayerService: Error during cleanupQada:', error);
        }
    }
};

window.PrayerService = PrayerService;
