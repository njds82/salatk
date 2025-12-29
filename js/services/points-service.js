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

    async addPoints(amount, reason) {
        const record = {
            amount: amount,
            reason: reason,
            timestamp: Date.now()
        };
        console.log(`PointsService: Adding ${amount} points for "${reason}"`);
        await db.points.add(record);

        // Trigger UI update if needed (via Event or direct call?)
        // For now, pages update themselves on render.

        if (window.SyncManager) {
            await SyncManager.pushPoint(amount, reason);
        }
    }
};

window.PointsService = PointsService;
