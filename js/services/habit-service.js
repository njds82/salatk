// ========================================
// Habit Service
// ========================================

const HabitService = {
    async getAll() {
        return await db.habits.toArray();
    },

    async add(name, type) {
        const habit = {
            id: crypto.randomUUID(),
            name,
            type,
            created: Date.now()
        };
        await db.habits.add(habit);

        if (window.SyncManager) SyncManager.pushHabit(habit);
        return habit;
    },

    async delete(id) {
        await db.habits.delete(id);
        await db.habit_history.where({ habitId: id }).delete();

        if (window.SyncManager) await SyncManager.deleteHabit(id);
    },

    async getHistory(habitId) {
        // Return object { date: action }
        const records = await db.habit_history.where({ habitId }).toArray();
        const history = {};
        records.forEach(r => history[r.date] = r.action);
        return history;
    },

    // Get history for all habits for specific date range or just 'today' helper
    async getDailyActions(date) {
        // Because we index [habitId+date], getting by date alone is not optimized unless we have index on 'date'.
        // Our schema: habit_history: '[habitId+date], habitId, date' -> 'date' is indexed second.
        const records = await db.habit_history.where('date').equals(date).toArray();
        return records;
    },

    async logAction(habitId, date, action) {
        const habit = await db.habits.get(habitId);
        if (!habit) throw new Error('Habit not found');

        const existing = await db.habit_history.get({ habitId, date });

        if (existing && existing.action === action) return; // No change

        // Logic for points needs to be handled via Deterministic IDs
        const pointId = `habit:${habitId}:${date}`;
        let pointsAmount = 0;
        let reason = '';

        if (habit.type === 'worship' && action === 'done') {
            pointsAmount = 1;
            reason = `${habit.name}`;
        } else if (habit.type === 'sin') {
            if (action === 'committed') {
                pointsAmount = -10;
                reason = `${habit.name} - ${t('mark_committed')}`;
            } else if (action === 'avoided') {
                pointsAmount = 1;
                reason = `${habit.name} - ${t('mark_avoided')}`;
            }
        }

        await db.habit_history.put({
            habitId,
            date,
            action,
            timestamp: Date.now()
        });

        // Update Points with deterministic ID
        // Note: Even if pointsAmount is 0 (optional action), we call it to ensure old records with this ID are cleared.
        await PointsService.addPoints(pointsAmount, reason, pointId);

        if (window.SyncManager) SyncManager.pushHabitAction(habitId, date, action);
    },

    async removeAction(habitId, date) {
        // Logic to remove action (Undo) and revert points
        const pointId = `habit:${habitId}:${date}`;

        await db.habit_history.where({ habitId, date }).delete();

        // Remove points (amount 0 + ID = delete)
        await PointsService.addPoints(0, `Reset habit action`, pointId);

        if (window.SyncManager) window.SyncManager.removeHabitAction(habitId, date);
    },

    // Get habit streak (consecutive days)
    async getStreak(habitId) {
        const habit = await db.habits.get(habitId);
        if (!habit) return 0;

        const records = await db.habit_history
            .where({ habitId })
            .reverse()
            .sortBy('date');

        let streak = 0;
        const today = getCurrentDate();
        let checkDate = parseDate(today);

        // Count consecutive days backwards from today
        for (let i = 0; i < 365; i++) { // Max 365 days check
            const recordDate = formatDate(checkDate);
            const record = records.find(r => r.date === recordDate);

            if (!record) break;

            // For worship habits, count 'done' actions
            // For sin habits, count 'avoided' actions
            if (habit.type === 'worship' && record.action === 'done') {
                streak++;
            } else if (habit.type === 'sin' && record.action === 'avoided') {
                streak++;
            } else {
                break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    },

    // Reset habit action (undo)
    async reset(habitId, date) {
        await this.removeAction(habitId, date);
        return { success: true };
    }
};

window.HabitService = HabitService;
