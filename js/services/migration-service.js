// ========================================
// Migration Service (LocalStorage -> IndexedDB)
// ========================================

const MigrationService = {
    async checkAndMigrate() {
        // Check if DB is empty (first run with new system)
        const count = await db.settings.count();
        if (count > 0) return; // Already initialized

        // Check if LocalStorage has legacy data
        const legacyJSON = localStorage.getItem('salatk_data');
        if (!legacyJSON) return; // No legacy data

        try {
            console.log('Migrating data from LocalStorage to IndexedDB...');
            const data = JSON.parse(legacyJSON);

            // 1. Settings
            if (data.settings) {
                const entries = Object.entries(data.settings).map(([k, v]) => ({ key: k, value: v }));
                await db.settings.bulkPut(entries);
            }

            // 2. Prayers
            if (data.prayers) {
                const prayerRecords = [];
                Object.entries(data.prayers).forEach(([date, dayRequest]) => {
                    Object.entries(dayRequest).forEach(([key, info]) => {
                        prayerRecords.push({
                            date: date,
                            key: key,
                            status: info.status,
                            timestamp: info.timestamp || Date.now()
                        });
                    });
                });
                await db.prayers.bulkPut(prayerRecords);
            }

            // 3. Qada
            if (data.qadaPrayers) {
                // Ensure IDs
                const qada = data.qadaPrayers.map(q => ({
                    ...q,
                    id: q.id || crypto.randomUUID()
                }));
                await db.qada.bulkPut(qada);
            }

            // 4. Habits
            if (data.habits) {
                // Split habits and history
                const habitDefs = [];
                const habitHist = [];

                data.habits.forEach(h => {
                    habitDefs.push({
                        id: h.id,
                        name: h.name,
                        type: h.type,
                        created: h.created
                    });

                    if (h.history) {
                        Object.entries(h.history).forEach(([date, action]) => {
                            habitHist.push({
                                habitId: h.id,
                                date: date,
                                action: action
                            });
                        });
                    }
                });

                await db.habits.bulkPut(habitDefs);
                await db.habit_history.bulkPut(habitHist);
            }

            // 5. Points
            if (data.points && data.points.history) {
                // Assuming history is array
                // We might need to handle huge history carefully, but bulkAdd is fast.
                // We don't have IDs in legacy, so let auto-increment handle it.
                await db.points.bulkAdd(data.points.history);
            }

            console.log('Migration complete.');
            // Optional: localStorage.removeItem('salatk_data'); // Keep for safety for now
        } catch (e) {
            console.error('Migration failed:', e);
        }
    }
};

window.MigrationService = MigrationService;
