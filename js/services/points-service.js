// ========================================
// Points Service
// ========================================

const PointsService = {
    async getTotal() {
        // Calculate total from history
        // Optimization: We could store a running total in a separate 'meta' table or 'settings' if history is huge.
        // For now, let's sum it up. Check performance later.
        // Actually, 'points.sum("amount")' is supported by some DBs? Dexie doesn't have direct 'sum'.
        // We will iterate or keep a cached total.
        const history = await db.points.toArray();
        return history.reduce((sum, item) => sum + (item.amount || 0), 0);
    },

    async getHistory() {
        return await db.points.orderBy('timestamp').reverse().toArray();
    },

    async addPoints(amount, reason, providedId = null) {
        const id = providedId || crypto.randomUUID();
        const record = {
            id: id,
            amount: amount,
            reason: reason,
            timestamp: Date.now()
        };
        console.log(`PointsService: Adding ${amount} points for "${reason}" (ID: ${id})`);

        // Use put instead of add to handle potential upserts/duplicates gracefully
        await db.points.put(record);

        if (window.SyncManager) {
            // We pass the amount and reason for backward compatibility, 
            // but we should also pass the id if SyncManager is updated.
            await SyncManager.pushPoint(amount, reason, id);
        }
    },

    async deduplicatePoints() {
        console.log('PointsService: Starting deep deduplication...');
        const allPoints = await db.points.toArray();
        const seen = new Set();
        const toDelete = [];
        const toUpdate = [];

        // 1. Identify legacy records (numeric IDs) and assign them UUIDs for stability
        allPoints.forEach(p => {
            if (typeof p.id === 'number') {
                const newId = crypto.randomUUID();
                toUpdate.push({ ...p, id: newId });
                // We'll process this update later, for now we treat it as its new ID for deduplication
                p.id = newId;
            }
        });

        if (toUpdate.length > 0) {
            console.log(`PointsService: Migrating ${toUpdate.length} legacy records to UUIDs.`);
            // Note: bulkPut with new IDs might leave old numeric records if the primary key changed from ++id to id.
            // Actually, in db.js we changed it from ++id to id. Hex numeric IDs will be replaced by UUIDs if we delete old?
            // Safer: delete all and put new, or just put new and hope primary key 'id' handles it if it's the same column.
            // Since we changed schema, the old numeric IDs are still valid primary keys until replaced.
            await db.points.bulkPut(toUpdate);
            // We should ideally delete old numeric ones too if they aren't auto-deleted by put?
            // Dexie 'id' primary key will treat numeric 1 and string 'uuid' as different unless we delete.
            const numericRecords = allPoints.filter(p => typeof p.id === 'number');
            if (numericRecords.length > 0) {
                await db.points.bulkDelete(numericRecords.map(r => r.id));
            }
        }

        // 2. Simple deduplication: same reason, same amount, same date (within 1 minute)
        allPoints.forEach(p => {
            const dateStr = new Date(p.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
            const key = `${p.reason}|${p.amount}|${dateStr}`;

            if (seen.has(key)) {
                toDelete.push(p.id);
            } else {
                seen.add(key);
            }
        });

        if (toDelete.length > 0) {
            console.log(`PointsService: Removing ${toDelete.length} duplicate point records from local and cloud.`);
            await db.points.bulkDelete(toDelete);

            // Clean up cloud too
            if (window.SyncManager && window.SyncManager.removePoint) {
                for (const id of toDelete) {
                    // Fire and forget deletions to not block startup
                    SyncManager.removePoint(id);
                }
            }
        } else {
            console.log('PointsService: No duplicates found.');
        }
    }
};

window.PointsService = PointsService;
