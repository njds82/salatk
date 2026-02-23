// ========================================
// Task Service
// ========================================

const TaskService = {
    _priorityWeight(priority) {
        switch (priority) {
            case 'high':
                return 3;
            case 'medium':
                return 2;
            case 'low':
                return 1;
            default:
                return 0;
        }
    },

    _mapTaskRow(row) {
        if (!row) return null;
        return {
            id: row.id,
            title: row.title,
            priority: row.priority,
            dueDate: row.due_date,
            status: row.status,
            completedAt: row.completed_at,
            rolloverCount: row.rollover_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    },

    _sortTasks(tasks, filter) {
        const safeTasks = [...(tasks || [])];

        if (filter === 'completed') {
            safeTasks.sort((a, b) => {
                const aTs = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                const bTs = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                return bTs - aTs;
            });
            return safeTasks;
        }

        safeTasks.sort((a, b) => {
            const dueCompare = a.dueDate.localeCompare(b.dueDate);
            if (dueCompare !== 0) return dueCompare;

            const priorityCompare = this._priorityWeight(b.priority) - this._priorityWeight(a.priority);
            if (priorityCompare !== 0) return priorityCompare;

            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aCreated - bCreated;
        });

        return safeTasks;
    },

    async _getSession() {
        if (!window.AuthManager) return null;
        return await window.AuthManager.getSession();
    },

    async _withTimeout(promise, timeoutMs, timeoutValue = null) {
        let timeoutId;
        const timeoutPromise = new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    },

    _validateTitle(title) {
        const safeTitle = (title || '').trim();
        if (!safeTitle) throw new Error('TASK_TITLE_REQUIRED');
        if (safeTitle.length > 140) throw new Error('TASK_TITLE_TOO_LONG');
        return safeTitle;
    },

    _validatePriority(priority) {
        const safePriority = priority || 'medium';
        if (!['low', 'medium', 'high'].includes(safePriority)) {
            throw new Error('TASK_PRIORITY_INVALID');
        }
        return safePriority;
    },

    _validateDate(dueDate) {
        const safeDate = dueDate || getCurrentDate();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) {
            throw new Error('TASK_DATE_INVALID');
        }
        return safeDate;
    },

    async getTasksByFilter(filter, todayDate = getCurrentDate()) {
        if (!window.supabaseClient) return [];

        const session = await this._getSession();
        if (!session) return [];

        const safeFilter = filter || 'today';
        let query = window.supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', session.user.id);

        if (safeFilter === 'today') {
            query = query
                .eq('status', 'pending')
                .eq('due_date', todayDate);
        } else if (safeFilter === 'upcoming') {
            query = query
                .eq('status', 'pending')
                .gt('due_date', todayDate);
        } else if (safeFilter === 'completed') {
            query = query.eq('status', 'completed');
        } else {
            query = query.eq('status', 'pending').eq('due_date', todayDate);
        }

        const { data, error } = await this._withTimeout(
            query,
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TaskService: Failed to fetch tasks', error);
            return [];
        }

        const mapped = (data || []).map((row) => this._mapTaskRow(row));
        return this._sortTasks(mapped, safeFilter);
    },

    async getTaskById(taskId) {
        if (!window.supabaseClient || !taskId) return null;

        const session = await this._getSession();
        if (!session) return null;

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('id', taskId)
                .maybeSingle(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TaskService: Failed to fetch task by id', error);
            return null;
        }

        return this._mapTaskRow(data);
    },

    async createTask({ title, priority, dueDate }) {
        if (!window.supabaseClient) return null;

        const session = await this._getSession();
        if (!session) return null;

        const safeTitle = this._validateTitle(title);
        const safePriority = this._validatePriority(priority);
        const safeDueDate = this._validateDate(dueDate);

        const payload = {
            user_id: session.user.id,
            title: safeTitle,
            priority: safePriority,
            due_date: safeDueDate,
            status: 'pending'
        };

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .insert(payload)
                .select('*')
                .single(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error) {
            console.error('TaskService: Failed to create task', error);
            throw new Error('TASK_CREATE_FAILED');
        }

        return this._mapTaskRow(data);
    },

    async updateTask(taskId, { title, priority, dueDate }) {
        if (!window.supabaseClient || !taskId) return null;

        const session = await this._getSession();
        if (!session) return null;

        const task = await this.getTaskById(taskId);
        if (!task) throw new Error('TASK_NOT_FOUND');
        if (task.status === 'completed') throw new Error('TASK_EDIT_COMPLETED_FORBIDDEN');

        const updates = {};

        if (typeof title !== 'undefined') {
            updates.title = this._validateTitle(title);
        }

        if (typeof priority !== 'undefined') {
            updates.priority = this._validatePriority(priority);
        }

        if (typeof dueDate !== 'undefined') {
            updates.due_date = this._validateDate(dueDate);
        }

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .update(updates)
                .eq('user_id', session.user.id)
                .eq('id', taskId)
                .select('*')
                .single(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error) {
            console.error('TaskService: Failed to update task', error);
            throw new Error('TASK_UPDATE_FAILED');
        }

        return this._mapTaskRow(data);
    },

    async toggleTaskStatus(taskId, nextStatus) {
        if (!window.supabaseClient || !taskId) return null;

        const session = await this._getSession();
        if (!session) return null;

        const safeStatus = nextStatus === 'completed' ? 'completed' : 'pending';
        const task = await this.getTaskById(taskId);
        if (!task) throw new Error('TASK_NOT_FOUND');

        if (task.status === safeStatus) {
            return task;
        }

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .update({ status: safeStatus })
                .eq('user_id', session.user.id)
                .eq('id', taskId)
                .select('*')
                .single(),
            8000,
            { data: null, error: 'timeout' }
        );

        if (error) {
            console.error('TaskService: Failed to toggle task status', error);
            throw new Error('TASK_STATUS_UPDATE_FAILED');
        }

        const pointId = `task:${taskId}`;
        if (safeStatus === 'completed') {
            await PointsService.addPoints(1, `Task completed: ${task.title}`, pointId);
        } else {
            await PointsService.addPoints(0, 'Task completion removed', pointId);
        }

        return this._mapTaskRow(data);
    },

    async deleteTask(taskId) {
        if (!window.supabaseClient || !taskId) return false;

        const session = await this._getSession();
        if (!session) return false;

        const task = await this.getTaskById(taskId);
        if (!task) throw new Error('TASK_NOT_FOUND');
        if (task.status === 'completed') {
            throw new Error('TASK_DELETE_COMPLETED_FORBIDDEN');
        }

        const { error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .delete()
                .eq('user_id', session.user.id)
                .eq('id', taskId),
            8000,
            { error: 'timeout' }
        );

        if (error) {
            console.error('TaskService: Failed to delete task', error);
            throw new Error('TASK_DELETE_FAILED');
        }

        return true;
    },

    async rolloverPendingTasks(todayDate = getCurrentDate()) {
        if (!window.supabaseClient) return { updatedCount: 0 };

        const session = await this._getSession();
        if (!session) return { updatedCount: 0 };

        const safeToday = this._validateDate(todayDate);

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .select('id,rollover_count')
                .eq('user_id', session.user.id)
                .eq('status', 'pending')
                .lt('due_date', safeToday),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TaskService: Failed to fetch overdue tasks for rollover', error);
            return { updatedCount: 0 };
        }

        const overdueTasks = data || [];
        if (overdueTasks.length === 0) {
            return { updatedCount: 0 };
        }

        await Promise.all(
            overdueTasks.map((task) =>
                this._withTimeout(
                    window.supabaseClient
                        .from('tasks')
                        .update({
                            due_date: safeToday,
                            rollover_count: (task.rollover_count || 0) + 1
                        })
                        .eq('user_id', session.user.id)
                        .eq('id', task.id),
                    8000,
                    { error: 'timeout' }
                )
            )
        );

        return { updatedCount: overdueTasks.length };
    },

    async cleanupCompletedTasks(retentionDays = 30) {
        if (!window.supabaseClient) return { deletedCount: 0 };

        const session = await this._getSession();
        if (!session) return { deletedCount: 0 };

        const safeDays = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - safeDays);

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .delete()
                .eq('user_id', session.user.id)
                .eq('status', 'completed')
                .lt('completed_at', cutoff.toISOString())
                .select('id'),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TaskService: Failed to cleanup completed tasks', error);
            return { deletedCount: 0 };
        }

        return { deletedCount: (data || []).length };
    },

    async getDailyTaskStats(todayDate = getCurrentDate()) {
        if (!window.supabaseClient) {
            return {
                total: 0,
                done: 0,
                pending: 0,
                rate: 0
            };
        }

        const session = await this._getSession();
        if (!session) {
            return {
                total: 0,
                done: 0,
                pending: 0,
                rate: 0
            };
        }

        const safeToday = this._validateDate(todayDate);

        const { data, error } = await this._withTimeout(
            window.supabaseClient
                .from('tasks')
                .select('status')
                .eq('user_id', session.user.id)
                .eq('due_date', safeToday),
            8000,
            { data: [], error: 'timeout' }
        );

        if (error && error !== 'timeout') {
            console.error('TaskService: Failed to fetch daily task stats', error);
            return {
                total: 0,
                done: 0,
                pending: 0,
                rate: 0
            };
        }

        const rows = data || [];
        const total = rows.length;
        const done = rows.filter((row) => row.status === 'completed').length;
        const pending = total - done;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, done, pending, rate };
    }
};

window.TaskService = TaskService;
