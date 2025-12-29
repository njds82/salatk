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
        console.log('PointsService: Starting deduplication...');
        const allPoints = await db.points.toArray();
        const seen = new Set();
        const toDelete = [];

        // Simple deduplication: same reason, same amount, same date (within 1 minute)
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
            console.log(`PointsService: Removing ${toDelete.length} duplicate point records.`);
            await db.points.bulkDelete(toDelete);
        } else {
            console.log('PointsService: No duplicates found.');
        }
    }
};

window.PointsService = PointsService;
