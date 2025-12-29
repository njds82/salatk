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

        if (window.SyncManager) SyncManager.deleteHabit(id);
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

        // Calculate points
        let pointsChange = 0;
        let reason = '';

        // Revert old
        if (existing) {
            if (habit.type === 'worship' && existing.action === 'done') pointsChange -= 1;
            else if (habit.type === 'sin') {
                if (existing.action === 'committed') pointsChange += 10; // Refund penalty
                if (existing.action === 'avoided') pointsChange -= 1;
            }
        }

        // Apply new
        if (habit.type === 'worship' && action === 'done') {
            pointsChange += 1;
            reason = `${habit.name}`;
        } else if (habit.type === 'sin') {
            if (action === 'committed') {
                pointsChange -= 10;
                reason = `${habit.name} - ${t('mark_committed')}`;
            } else if (action === 'avoided') {
                pointsChange += 1;
                reason = `${habit.name} - ${t('mark_avoided')}`;
            }
        }

        await db.habit_history.put({
            habitId,
            date,
            action,
            timestamp: Date.now()
        });

        if (pointsChange !== 0) {
            await PointsService.addPoints(pointsChange, reason);
        }

        if (window.SyncManager) SyncManager.pushHabitAction(habitId, date, action);
    },

    async removeAction(habitId, date) {
        // Logic to remove action (Undo) and revert points
        const habit = await db.habits.get(habitId);
        const existing = await db.habit_history.get({ habitId, date });

        if (!existing) return;

        let pointsChange = 0;
        if (habit.type === 'worship' && existing.action === 'done') pointsChange -= 1;
        else if (habit.type === 'sin') {
            if (existing.action === 'committed') pointsChange += 10;
            if (existing.action === 'avoided') pointsChange -= 1;
        }

        await db.habit_history.where({ habitId, date }).delete();

        if (pointsChange !== 0) {
            await PointsService.addPoints(pointsChange, `${habit.name} - ${t('reset_decision')}`);
        }

        if (window.SyncManager) SyncManager.removeHabitAction(habitId, date);
    }
};

window.HabitService = HabitService;
