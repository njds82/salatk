// ========================================
// Points Service
// ========================================

const PointsService = {
    async getTotal() {
        // Calculate total from history
        // Optimization: We could store a running total in a separate 'meta' table or 'settings' if history is huge.
        // For now, let's sum it up. Check performance later.
        // We will iterate or keep a cached total.
        const history = await db.points.toArray();
        return history.reduce((sum, item) => sum + (item.amount || 0), 0);
    },

    async getHistory() {
        return await db.points.orderBy('timestamp').reverse().toArray();
    },

    async addPoints(amount, reason, providedId = null) {
        // If amount is 0, we should remove the record if it exists with that ID
        if (amount === 0 && providedId) {
            console.log(`PointsService: Removing point record for "${reason}" (ID: ${providedId})`);
            await db.points.delete(providedId);
            if (window.SyncManager) {
                await SyncManager.removePoint(providedId);
            }
            return;
        }

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
            await SyncManager.pushPoint(amount, reason, id);
        }
    },

    async deduplicatePoints() {
        console.log('PointsService: Starting deep deduplication...');
        const allPoints = await db.points.toArray();
        const seen = new Map(); // Use Map to keep the "best" record
        const toDeleteIDs = [];
        const toUpdate = [];

        // 1. Identification and Normalization
        allPoints.forEach(p => {
            // Normalize legacy records (numeric IDs)
            if (typeof p.id === 'number') {
                const legacyId = p.id;
                // If we can generate a deterministic ID for it (e.g. from reason), we might.
                p.id = crypto.randomUUID();
                toUpdate.push(p);
                toDeleteIDs.push(legacyId);
            }
        });

        if (toUpdate.length > 0) {
            console.log(`PointsService: Migrating ${toUpdate.length} legacy records.`);
            await db.points.bulkPut(toUpdate);
            await db.points.bulkDelete(toDeleteIDs);
        }

        // 2. Advanced deduplication by content (for records without deterministic IDs)
        // We re-query all points after normalization
        const currentPoints = await db.points.toArray();
        const finalToDelete = [];

        currentPoints.forEach(p => {
            // Criteria: Same reason, same amount, same date (within 10 minutes)
            const dateStr = new Date(p.timestamp).toISOString().slice(0, 15); // YYYY-MM-DDTHH:m (10 min buckets approx)
            const key = `${p.reason}|${p.amount}|${dateStr}`;

            if (seen.has(key)) {
                // Keep the one that already has a deterministic-looking ID (non-UUID-v4 usually contains :)
                const existing = seen.get(key);
                const isDeterministic = (id) => id.includes(':');

                if (isDeterministic(p.id) && !isDeterministic(existing.id)) {
                    finalToDelete.push(existing.id);
                    seen.set(key, p);
                } else {
                    finalToDelete.push(p.id);
                }
            } else {
                seen.set(key, p);
            }
        });

        if (finalToDelete.length > 0) {
            console.log(`PointsService: Removing ${finalToDelete.length} duplicate point records.`);
            await db.points.bulkDelete(finalToDelete);

            if (window.SyncManager) {
                for (const id of finalToDelete) {
                    SyncManager.removePoint(id);
                }
            }
        } else {
            console.log('PointsService: No duplicates found.');
        }
    }
};

window.PointsService = PointsService;
