// ========================================
// Habit Service
// ========================================

const HabitService = {
    _emptyStats() {
        return {
            totalLoggedDays: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActionDate: null
        };
    },

    _isSuccessAction(habitType, action) {
        if (habitType === 'worship') return action === 'done';
        return action === 'avoided';
    },

    _getWindowStart(days) {
        if (typeof days !== 'number' || days <= 0) return null;
        const endDate = parseDate(getCurrentDate());
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1));
        return formatDate(startDate);
    },

    _calculateCurrentStreak(actionByDate, habitType, windowStart = null) {
        let streak = 0;
        let checkDate = parseDate(getCurrentDate());

        for (let i = 0; i < 365; i++) {
            const dateStr = formatDate(checkDate);
            if (windowStart && dateStr < windowStart) break;

            const action = actionByDate[dateStr];
            if (!action) break;

            if (this._isSuccessAction(habitType, action)) {
                streak++;
            } else {
                break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    },

    _calculateLongestStreak(records, habitType) {
        let longestStreak = 0;
        let runningStreak = 0;
        let previousDate = null;
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (const record of records) {
            const currentDate = parseDate(record.date);

            if (previousDate) {
                const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / oneDayMs);
                if (diffDays !== 1) {
                    runningStreak = 0;
                }
            }

            if (this._isSuccessAction(habitType, record.action)) {
                runningStreak += 1;
                if (runningStreak > longestStreak) {
                    longestStreak = runningStreak;
                }
            } else {
                runningStreak = 0;
            }

            previousDate = currentDate;
        }

        return longestStreak;
    },

    _buildMetrics(records, habitType, days = null) {
        const sortedRecords = [...(records || [])].sort((a, b) => a.date.localeCompare(b.date));
        const windowStart = this._getWindowStart(days);
        const scopedRecords = windowStart
            ? sortedRecords.filter(r => r.date >= windowStart)
            : sortedRecords;

        const totalLoggedDays = scopedRecords.length;
        const actionByDate = {};
        scopedRecords.forEach(record => {
            actionByDate[record.date] = record.action;
        });

        const daysDone = scopedRecords.filter(r => r.action === 'done').length;
        const daysAvoided = scopedRecords.filter(r => r.action === 'avoided').length;
        const daysCommitted = scopedRecords.filter(r => r.action === 'committed').length;
        const consistencyRate = totalLoggedDays > 0 ? Math.round((daysDone / totalLoggedDays) * 100) : 0;
        const avoidanceRate = totalLoggedDays > 0 ? Math.round((daysAvoided / totalLoggedDays) * 100) : 0;

        const currentStreak = this._calculateCurrentStreak(actionByDate, habitType, windowStart);
        const longestStreak = this._calculateLongestStreak(scopedRecords, habitType);

        let lastDoneDate = null;
        let lastCommittedDate = null;
        for (let i = scopedRecords.length - 1; i >= 0; i--) {
            const record = scopedRecords[i];
            if (!lastDoneDate && record.action === 'done') {
                lastDoneDate = record.date;
            }
            if (!lastCommittedDate && record.action === 'committed') {
                lastCommittedDate = record.date;
            }
            if (lastDoneDate && lastCommittedDate) break;
        }

        return {
            totalLoggedDays,
            daysDone,
            daysAvoided,
            daysCommitted,
            consistencyRate,
            avoidanceRate,
            currentWorshipStreak: habitType === 'worship' ? currentStreak : 0,
            longestWorshipStreak: habitType === 'worship' ? longestStreak : 0,
            currentCleanStreak: habitType === 'sin' ? currentStreak : 0,
            longestCleanStreak: habitType === 'sin' ? longestStreak : 0,
            lastDoneDate,
            lastCommittedDate,
            lastActionDate: totalLoggedDays > 0 ? scopedRecords[scopedRecords.length - 1].date : null
        };
    },

    _buildViewModel(habitType, allTime, last30, trendVsAllTime) {
        if (habitType === 'worship') {
            return {
                trendVsAllTime,
                allTimeItems: [
                    { labelKey: 'days_done', value: allTime.daysDone, format: 'number' },
                    { labelKey: 'total_logged_days', value: allTime.totalLoggedDays, format: 'number' },
                    { labelKey: 'consistency_rate', value: allTime.consistencyRate, format: 'percent' },
                    { labelKey: 'current_worship_streak', value: allTime.currentWorshipStreak, format: 'number' },
                    { labelKey: 'longest_worship_streak', value: allTime.longestWorshipStreak, format: 'number' },
                    { labelKey: 'last_done_date', value: allTime.lastDoneDate, format: 'date' }
                ],
                last30Items: [
                    { labelKey: 'days_done', value: last30.daysDone, format: 'number' },
                    { labelKey: 'total_logged_days', value: last30.totalLoggedDays, format: 'number' },
                    { labelKey: 'consistency_rate', value: last30.consistencyRate, format: 'percent' },
                    { labelKey: 'current_worship_streak', value: last30.currentWorshipStreak, format: 'number' },
                    { labelKey: 'longest_worship_streak', value: last30.longestWorshipStreak, format: 'number' },
                    { labelKey: 'last_done_date', value: last30.lastDoneDate, format: 'date' }
                ]
            };
        }

        return {
            trendVsAllTime,
            allTimeItems: [
                { labelKey: 'days_avoided', value: allTime.daysAvoided, format: 'number' },
                { labelKey: 'days_committed', value: allTime.daysCommitted, format: 'number' },
                { labelKey: 'avoidance_rate', value: allTime.avoidanceRate, format: 'percent' },
                { labelKey: 'current_clean_streak', value: allTime.currentCleanStreak, format: 'number' },
                { labelKey: 'longest_clean_streak', value: allTime.longestCleanStreak, format: 'number' },
                { labelKey: 'last_committed_date', value: allTime.lastCommittedDate, format: 'date' }
            ],
            last30Items: [
                { labelKey: 'days_avoided', value: last30.daysAvoided, format: 'number' },
                { labelKey: 'days_committed', value: last30.daysCommitted, format: 'number' },
                { labelKey: 'avoidance_rate', value: last30.avoidanceRate, format: 'percent' },
                { labelKey: 'current_clean_streak', value: last30.currentCleanStreak, format: 'number' },
                { labelKey: 'longest_clean_streak', value: last30.longestCleanStreak, format: 'number' },
                { labelKey: 'last_committed_date', value: last30.lastCommittedDate, format: 'date' }
            ]
        };
    },

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

    async getHabitDetailsStats(habitId) {
        if (!window.supabaseClient) return null;
        const session = await window.AuthManager.getSession();
        if (!session) return null;

        const { data: habit } = await withTimeout(
            window.supabaseClient
                .from('habits')
                .select('id,name,type')
                .eq('id', habitId)
                .eq('user_id', session.user.id)
                .single(),
            8000,
            { data: null }
        );

        if (!habit) return null;

        const { data: records } = await withTimeout(
            window.supabaseClient
                .from('habit_history')
                .select('date,action')
                .eq('user_id', session.user.id)
                .eq('habit_id', habitId),
            8000,
            { data: [] }
        );

        const allRecords = records || [];
        const allTime = this._buildMetrics(allRecords, habit.type);
        const last30 = this._buildMetrics(allRecords, habit.type, 30);

        const allTimeRate = habit.type === 'worship' ? allTime.consistencyRate : allTime.avoidanceRate;
        const last30Rate = habit.type === 'worship' ? last30.consistencyRate : last30.avoidanceRate;
        const trendVsAllTime = (allTime.totalLoggedDays > 0 && last30.totalLoggedDays > 0)
            ? (last30Rate - allTimeRate)
            : null;

        return {
            habit: {
                id: habit.id,
                name: habit.name,
                type: habit.type
            },
            allTime,
            last30,
            viewModel: this._buildViewModel(habit.type, allTime, last30, trendVsAllTime)
        };
    },

    async getHabitsCardMeta(selectedDate) {
        const emptyResult = { statusByHabitId: {}, streakByHabitId: {} };

        if (!window.supabaseClient) return emptyResult;
        const session = await window.AuthManager.getSession();
        if (!session) return emptyResult;

        const { data: habits } = await withTimeout(
            window.supabaseClient
                .from('habits')
                .select('id,type')
                .eq('user_id', session.user.id),
            8000,
            { data: [] }
        );

        const safeHabits = habits || [];
        if (safeHabits.length === 0) return emptyResult;

        const habitIds = safeHabits.map(h => h.id);

        const { data: history } = await withTimeout(
            window.supabaseClient
                .from('habit_history')
                .select('habit_id,date,action')
                .eq('user_id', session.user.id)
                .in('habit_id', habitIds),
            8000,
            { data: [] }
        );

        const statusByHabitId = {};
        const actionByHabitDate = {};

        (history || []).forEach(record => {
            if (!actionByHabitDate[record.habit_id]) {
                actionByHabitDate[record.habit_id] = {};
            }
            actionByHabitDate[record.habit_id][record.date] = record.action;

            if (record.date === selectedDate) {
                statusByHabitId[record.habit_id] = record.action;
            }
        });

        const streakByHabitId = {};
        safeHabits.forEach(habit => {
            const actionByDate = actionByHabitDate[habit.id] || {};
            streakByHabitId[habit.id] = this._calculateCurrentStreak(actionByDate, habit.type);
        });

        return { statusByHabitId, streakByHabitId };
    },

    async getStats(habitId, days = null) {
        const details = await this.getHabitDetailsStats(habitId);
        if (!details || !details.habit) return this._emptyStats();

        const metrics = (typeof days === 'number' && days > 0) ? details.last30 : details.allTime;
        const isWorship = details.habit.type === 'worship';

        return {
            totalLoggedDays: metrics.totalLoggedDays,
            successCount: isWorship ? metrics.daysDone : metrics.daysAvoided,
            failureCount: isWorship ? 0 : metrics.daysCommitted,
            successRate: isWorship ? metrics.consistencyRate : metrics.avoidanceRate,
            currentStreak: isWorship ? metrics.currentWorshipStreak : metrics.currentCleanStreak,
            longestStreak: isWorship ? metrics.longestWorshipStreak : metrics.longestCleanStreak,
            lastActionDate: isWorship ? metrics.lastDoneDate : metrics.lastCommittedDate
        };
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
        const session = await window.AuthManager.getSession();
        if (!session) return 0;

        const [{ data: records }, { data: habit }] = await Promise.all([
            window.supabaseClient
                .from('habit_history')
                .select('date,action')
                .eq('habit_id', habitId)
                .eq('user_id', session.user.id),
            window.supabaseClient
                .from('habits')
                .select('type')
                .eq('id', habitId)
                .eq('user_id', session.user.id)
                .single()
        ]);

        if (!records || !habit) return 0;

        const actionByDate = {};
        records.forEach(record => {
            actionByDate[record.date] = record.action;
        });

        return this._calculateCurrentStreak(actionByDate, habit.type);
    },

    // Reset habit action (undo)
    async reset(habitId, date) {
        await this.removeAction(habitId, date);
        return { success: true };
    }
};

window.HabitService = HabitService;
