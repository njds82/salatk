// ========================================
// Habit Service
// ========================================

const HabitService = {
    async getAll() {
        if (!window.supabaseClient) return [];
        const session = await window.AuthManager.getSession();
        if (!session) return [];

        const { data } = await withTimeout(
            window.supabaseClient
                .from('habits')
                .select('*')
                .eq('user_id', session.user.id),
            8000,
            { data: [] }
        );

        return (data || []).map(h => ({
            id: h.id,
            name: h.name,
            type: h.type,
            created: new Date(h.created_at).getTime()
        }));
    },

    async add(name, type) {
        if (!window.supabaseClient) return null;
        const session = await window.AuthManager.getSession();
        if (!session) return null;

        const habit = {
            id: crypto.randomUUID(),
            user_id: session.user.id,
            name,
            type,
            created_at: new Date().toISOString()
        };

        await withTimeout(
            window.supabaseClient.from('habits').insert(habit),
            5000
        );

        return { ...habit, created: new Date(habit.created_at).getTime() };
    },

    async delete(id) {
        if (!window.supabaseClient) return;
        await window.supabaseClient.from('habits').delete().eq('id', id);
        await window.supabaseClient.from('habit_history').delete().eq('habit_id', id);
    },

    async getHistory(habitId) {
        if (!window.supabaseClient) return {};
        const { data } = await window.supabaseClient
            .from('habit_history')
            .select('*')
            .eq('habit_id', habitId);

        const history = {};
        (data || []).forEach(r => history[r.date] = r.action);
        return history;
    },

    async getDailyActions(date) {
        if (!window.supabaseClient) return [];
        const session = await window.AuthManager.getSession();
        if (!session) return [];

        const { data } = await withTimeout(
            window.supabaseClient
                .from('habit_history')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('date', date),
            8000,
            { data: [] }
        );

        return (data || []).map(r => ({
            habitId: r.habit_id,
            date: r.date,
            action: r.action,
            timestamp: new Date(r.recorded_at).getTime()
        }));
    },

    async logAction(habitId, date, action) {
        if (!window.supabaseClient) return;
        const session = await window.AuthManager.getSession();
        if (!session) return;

        // Fetch habit details for point calculation
        const { data: habit } = await window.supabaseClient.from('habits').select('*').eq('id', habitId).single();
        if (!habit) throw new Error(t('error_general'));

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

        await window.supabaseClient.from('habit_history').upsert({
            user_id: session.user.id,
            habit_id: habitId,
            date,
            action,
            recorded_at: new Date().toISOString()
        }, { onConflict: 'user_id,habit_id,date' });

        await PointsService.addPoints(pointsAmount, reason, pointId);
    },

    async removeAction(habitId, date) {
        if (!window.supabaseClient) return;
        const session = await window.AuthManager.getSession();
        if (!session) return;

        const pointId = `habit:${habitId}:${date}`;

        await window.supabaseClient.from('habit_history')
            .delete()
            .eq('user_id', session.user.id)
            .eq('habit_id', habitId)
            .eq('date', date);

        await PointsService.addPoints(0, `Reset habit action`, pointId);
    },

    // Get habit streak (consecutive days)
    async getStreak(habitId) {
        if (!window.supabaseClient) return 0;

        const { data: records } = await window.supabaseClient
            .from('habit_history')
            .select('*')
            .eq('habit_id', habitId)
            .order('date', { ascending: false });

        if (!records) return 0;

        // need habit type
        const { data: habit } = await window.supabaseClient.from('habits').select('type').eq('id', habitId).single();
        if (!habit) return 0;

        let streak = 0;
        const today = getCurrentDate();
        let checkDate = parseDate(today);

        for (let i = 0; i < 365; i++) {
            const dateStr = formatDate(checkDate);
            const record = records.find(r => r.date === dateStr);

            if (!record) break;

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
