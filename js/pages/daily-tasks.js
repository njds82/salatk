// ========================================
// Daily Tasks Page
// ========================================

window.currentTaskFilter = window.currentTaskFilter || 'today';

function escapeTaskText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getTaskPriorityClass(priority) {
    if (priority === 'high') return 'task-priority-high';
    if (priority === 'medium') return 'task-priority-medium';
    return 'task-priority-low';
}

function getTaskPriorityLabel(priority) {
    if (priority === 'high') return t('task_priority_high');
    if (priority === 'medium') return t('task_priority_medium');
    return t('task_priority_low');
}

function renderTaskCard(task) {
    const isCompleted = task.status === 'completed';

    return `
        <div class="card task-card ${isCompleted ? 'task-card-completed' : 'task-card-pending'}" data-task-id="${task.id}">
            <div class="task-card-top">
                <div class="task-card-main">
                    <h3 class="task-title">${escapeTaskText(task.title)}</h3>
                    <div class="task-meta-row">
                        <span class="task-priority-badge ${getTaskPriorityClass(task.priority)}">
                            ${getTaskPriorityLabel(task.priority)}
                        </span>
                        <span class="task-due-date">${formatDisplayDate(task.dueDate)}</span>
                    </div>
                </div>
                <div class="options-menu">
                    <button class="options-btn" aria-label="Task actions">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M10 6 C11 6 11 10 10 10 C9 10 9 6 10 6 M10 14 C11 14 11 18 10 18 C9 18 9 14 10 14 M10 -2 C11 -2 11 2 10 2 C9 2 9 -2 10 -2" transform="translate(0, 4)" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </button>
                    <div class="dropdown-menu">
                        ${!isCompleted ? `
                            <button class="dropdown-item" onclick="showEditTaskModal('${task.id}')">
                                <span>✎</span> ${t('task_edit')}
                            </button>
                        ` : ''}
                        ${!isCompleted ? `
                            <button class="dropdown-item danger" onclick="handleDeleteTask('${task.id}')">
                                <span>🗑</span> ${t('task_delete')}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="task-actions-row">
                ${isCompleted ? `
                    <button class="btn btn-secondary" onclick="handleToggleTask('${task.id}', 'pending')">
                        ${t('task_mark_pending')}
                    </button>
                ` : `
                    <button class="btn btn-success" onclick="handleToggleTask('${task.id}', 'completed')">
                        ${t('task_mark_complete')} (+1)
                    </button>
                `}
            </div>
        </div>
    `;
}

async function renderDailyTasksPage() {
    const today = getCurrentDate();
    const activeFilter = window.currentTaskFilter || 'today';

    const [tasks, stats] = await Promise.all([
        TaskService.getTasksByFilter(activeFilter, today),
        TaskService.getDailyTaskStats(today)
    ]);

    const filters = [
        { key: 'today', label: t('task_filter_today') },
        { key: 'upcoming', label: t('task_filter_upcoming') },
        { key: 'completed', label: t('task_filter_completed') }
    ];

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('daily_tasks_title')}</h1>
            <p class="page-subtitle">${t('daily_tasks_subtitle')}</p>
        </div>

        <div class="task-filter-bar">
            ${filters.map(filter => `
                <button
                    class="task-filter-btn ${activeFilter === filter.key ? 'active' : ''}"
                    onclick="setTaskFilter('${filter.key}')"
                >
                    ${filter.label}
                </button>
            `).join('')}
        </div>

        <div class="card task-stats-card">
            <div class="task-stats-grid">
                <div class="task-stat-item">
                    <span class="task-stat-label">${t('task_stats_total')}</span>
                    <strong class="task-stat-value">${stats.total}</strong>
                </div>
                <div class="task-stat-item">
                    <span class="task-stat-label">${t('task_stats_done')}</span>
                    <strong class="task-stat-value">${stats.done}</strong>
                </div>
                <div class="task-stat-item">
                    <span class="task-stat-label">${t('task_stats_pending')}</span>
                    <strong class="task-stat-value">${stats.pending}</strong>
                </div>
                <div class="task-stat-item">
                    <span class="task-stat-label">${t('task_stats_rate')}</span>
                    <strong class="task-stat-value">${stats.rate}%</strong>
                </div>
            </div>
        </div>

        <div class="task-add-row">
            <button class="btn btn-primary" onclick="showAddTaskModal()">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${t('task_add')}
            </button>
        </div>
    `;

    if (!tasks || tasks.length === 0) {
        const emptyText = activeFilter === 'upcoming'
            ? t('task_empty_upcoming')
            : activeFilter === 'completed'
                ? t('task_empty_completed')
                : t('task_empty_today');

        html += `
            <div class="empty-state">
                <div class="empty-state-icon">🗂</div>
                <p class="empty-state-text">${emptyText}</p>
            </div>
        `;
    } else {
        html += `
            <div class="card-grid task-card-grid">
                ${tasks.map(task => renderTaskCard(task)).join('')}
            </div>
        `;
    }

    return html;
}

function setTaskFilter(filterKey) {
    window.currentTaskFilter = filterKey;
    renderPage('daily-tasks', true);
}

function showAddTaskModal() {
    const today = getCurrentDate();

    const content = `
        <div class="form-group">
            <label class="form-label" for="taskTitleInput">${t('task_title')}</label>
            <input type="text" class="form-input" id="taskTitleInput" maxlength="140" placeholder="${t('task_title_placeholder')}">
        </div>
        <div class="form-group">
            <label class="form-label" for="taskPrioritySelect">${t('task_priority')}</label>
            <select class="form-select" id="taskPrioritySelect">
                <option value="low">${t('task_priority_low')}</option>
                <option value="medium" selected>${t('task_priority_medium')}</option>
                <option value="high">${t('task_priority_high')}</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="taskDueDateInput">${t('task_due_date')}</label>
            <input type="date" class="form-input" id="taskDueDateInput" value="${today}">
        </div>
    `;

    showModal(
        t('task_add'),
        content,
        [
            {
                label: t('cancel'),
                className: 'btn-secondary',
                onclick: () => closeModal()
            },
            {
                label: t('save'),
                className: 'btn-primary',
                onclick: () => handleCreateTask()
            }
        ]
    );
}

async function handleCreateTask() {
    const title = document.getElementById('taskTitleInput')?.value?.trim() || '';
    const priority = document.getElementById('taskPrioritySelect')?.value || 'medium';
    const dueDate = document.getElementById('taskDueDateInput')?.value || getCurrentDate();

    if (!title) {
        showToast(t('task_title_required'), 'error');
        return;
    }

    try {
        await TaskService.createTask({ title, priority, dueDate });
        closeModal();
        showToast(t('task_created_success'), 'success');
        await renderPage('daily-tasks', true);
    } catch (error) {
        console.error('DailyTasks: Failed to create task', error);
        showToast(t('error_general'), 'error');
    }
}

async function showEditTaskModal(taskId) {
    try {
        const task = await TaskService.getTaskById(taskId);
        if (!task) {
            showToast(t('error_general'), 'error');
            return;
        }

        if (task.status === 'completed') {
            showToast(t('task_edit_completed_forbidden'), 'error');
            return;
        }

        const content = `
            <div class="form-group">
                <label class="form-label" for="taskEditTitleInput">${t('task_title')}</label>
                <input type="text" class="form-input" id="taskEditTitleInput" maxlength="140" value="${escapeTaskText(task.title)}">
            </div>
            <div class="form-group">
                <label class="form-label" for="taskEditPrioritySelect">${t('task_priority')}</label>
                <select class="form-select" id="taskEditPrioritySelect">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>${t('task_priority_low')}</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>${t('task_priority_medium')}</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>${t('task_priority_high')}</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="taskEditDueDateInput">${t('task_due_date')}</label>
                <input type="date" class="form-input" id="taskEditDueDateInput" value="${task.dueDate}">
            </div>
        `;

        showModal(
            t('task_edit'),
            content,
            [
                {
                    label: t('cancel'),
                    className: 'btn-secondary',
                    onclick: () => closeModal()
                },
                {
                    label: t('save'),
                    className: 'btn-primary',
                    onclick: () => handleUpdateTask(task.id)
                }
            ]
        );
    } catch (error) {
        console.error('DailyTasks: Failed to load edit modal', error);
        showToast(t('error_general'), 'error');
    }
}

async function handleUpdateTask(taskId) {
    const title = document.getElementById('taskEditTitleInput')?.value?.trim() || '';
    const priority = document.getElementById('taskEditPrioritySelect')?.value || 'medium';
    const dueDate = document.getElementById('taskEditDueDateInput')?.value || getCurrentDate();

    if (!title) {
        showToast(t('task_title_required'), 'error');
        return;
    }

    try {
        await TaskService.updateTask(taskId, { title, priority, dueDate });
        closeModal();
        showToast(t('task_updated_success'), 'success');
        await renderPage('daily-tasks', true);
    } catch (error) {
        console.error('DailyTasks: Failed to update task', error);
        if (error && error.message === 'TASK_EDIT_COMPLETED_FORBIDDEN') {
            showToast(t('task_edit_completed_forbidden'), 'error');
            return;
        }
        showToast(t('error_general'), 'error');
    }
}

async function handleToggleTask(taskId, nextStatus) {
    try {
        await TaskService.toggleTaskStatus(taskId, nextStatus);
        await updatePointsDisplay();
        showToast(nextStatus === 'completed' ? t('task_completed_success') : t('task_reopened_success'), 'success');
        await renderPage('daily-tasks', true);
    } catch (error) {
        console.error('DailyTasks: Failed to toggle task status', error);
        showToast(t('error_general'), 'error');
    }
}

function handleDeleteTask(taskId) {
    confirmDialog(t('confirm_delete'), async () => {
        try {
            await TaskService.deleteTask(taskId);
            showToast(t('task_deleted_success'), 'success');
            await renderPage('daily-tasks', true);
        } catch (error) {
            console.error('DailyTasks: Failed to delete task', error);
            if (error && error.message === 'TASK_DELETE_COMPLETED_FORBIDDEN') {
                showToast(t('task_delete_completed_forbidden'), 'error');
                return;
            }
            showToast(t('error_general'), 'error');
        }
    });
}

window.renderDailyTasksPage = renderDailyTasksPage;
window.showAddTaskModal = showAddTaskModal;
window.handleCreateTask = handleCreateTask;
window.showEditTaskModal = showEditTaskModal;
window.handleUpdateTask = handleUpdateTask;
window.handleToggleTask = handleToggleTask;
window.handleDeleteTask = handleDeleteTask;
window.setTaskFilter = setTaskFilter;
