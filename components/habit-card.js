// ========================================
// Habit Card Component
// ========================================

async function createHabitCard(habit, cardMeta = null) {
    const hasStreakMeta = cardMeta && typeof cardMeta.streak === 'number';
    const hasStatusMeta = cardMeta && Object.prototype.hasOwnProperty.call(cardMeta, 'todayStatus');

    const streak = hasStreakMeta ? cardMeta.streak : await HabitService.getStreak(habit.id);

    let todayStatus = null;
    if (hasStatusMeta) {
        todayStatus = cardMeta.todayStatus || null;
    } else {
        const history = await HabitService.getHistory(habit.id);
        todayStatus = history[window.selectedDate] || null;
    }

    const isWorshipHabit = habit.type === 'worship';
    const variableLink = window.VariableService ? VariableService.getForElement('habit', habit.id) : null;
    const variableBadge = variableLink
        ? `<span class="variable-badge" onclick="showHabitVariableModal('${habit.id}', '${habit.type}')" title="${typeof t === 'function' ? t('enter_variable') : 'المتغير'}">🔗 ${variableLink.variable}</span>`
        : '';

    return `
        <div class="card">
            <div class="habit-header">
                <div class="habit-header-main">
                    <div class="habit-header-row">
                        <h3 class="habit-name">${habit.name}</h3>
                        ${variableBadge}
                        <button class="btn btn-secondary habit-details-btn" onclick="showHabitDetailsModal('${habit.id}')">
                            ${t('details')}
                        </button>
                        <div class="options-menu">
                            <button class="options-btn">
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <path d="M10 6 C11 6 11 10 10 10 C9 10 9 6 10 6 M10 14 C11 14 11 18 10 18 C9 18 9 14 10 14 M10 -2 C11 -2 11 2 10 2 C9 2 9 -2 10 -2" transform="translate(0, 4)" stroke="currentColor" stroke-width="2" fill="none"/>
                                </svg>
                            </button>
                            <div class="dropdown-menu">
                                ${isWorshipHabit ? `
                                    <button class="dropdown-item" onclick="handleMarkHabit('${habit.id}', 'done')">
                                        <span style="color: var(--color-success)">●</span> ${t('mark_done')}
                                    </button>
                                ` : `
                                    <button class="dropdown-item" onclick="handleMarkHabit('${habit.id}', 'committed')">
                                        <span style="color: var(--color-error)">●</span> ${t('mark_committed')}
                                    </button>
                                    <button class="dropdown-item" onclick="handleMarkHabit('${habit.id}', 'avoided')">
                                        <span style="color: var(--color-success)">●</span> ${t('mark_avoided')}
                                    </button>
                                `}
                                <button class="dropdown-item danger" onclick="handleResetHabit('${habit.id}')">
                                    <span>↺</span> ${t('reset_decision')}
                                </button>
                                <button class="dropdown-item danger" onclick="handleDeleteHabit('${habit.id}')" style="border-top: 1px solid var(--color-border); margin-top: 4px; padding-top: 8px;">
                                    <span>🗑</span> ${t('delete')}
                                </button>
                                <button class="dropdown-item" onclick="showHabitVariableModal('${habit.id}', '${habit.type}')" style="border-top: 1px solid var(--color-border); margin-top: 4px; padding-top: 8px;">
                                    <span>🔗</span> ${t('enter_variable')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <span class="habit-type-badge" style="background: ${isWorshipHabit ? 'var(--color-worship)' : 'var(--color-sin)'};">
                        ${t(habit.type + '_habit')}
                    </span>
                </div>
            </div>
            
            ${streak > 0 ? `
            <div class="habit-streak">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 2 L12 8 L18 9 L13 13 L15 19 L10 15 L5 19 L7 13 L2 9 L8 8 Z" fill="currentColor"/>
                </svg>
                <span>${streak} ${t('days')}</span>
            </div>
            ` : ''}
            
            <div class="habit-actions">
                ${isWorshipHabit ? `
                    <button class="btn btn-success habit-action-btn" 
                            onclick="handleMarkHabit('${habit.id}', 'done')"
                            ${todayStatus === 'done' ? 'disabled' : ''}
                            >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ${t('mark_done')}
                    </button>
                ` : `
                    <button class="btn btn-danger habit-action-btn" 
                            onclick="handleMarkHabit('${habit.id}', 'committed')"
                            ${todayStatus ? 'disabled' : ''}
                            >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        ${t('mark_committed')}
                    </button>
                    <button class="btn btn-success habit-action-btn" 
                            onclick="handleMarkHabit('${habit.id}', 'avoided')"
                            ${todayStatus ? 'disabled' : ''}
                            >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ${t('mark_avoided')}
                    </button>
                `}
            </div>
        </div>
    `;
}

async function handleResetHabit(habitId) {
    try {
        if (!canEditDate(window.selectedDate)) {
            showToast(t('last_7_days_only'), 'error');
            return;
        }
        const result = await HabitService.reset(habitId, window.selectedDate);
        if (result.success) {
            showToast(t('undo_success'), 'info');
            await updatePointsDisplay();
            await updateHabitCard(habitId);
        }
    } catch (error) {
        console.error('Error in handleResetHabit:', error);
        showToast(t('error_general'), 'error');
    }
}

function showHabitVariableModal(habitId, habitType) {
    if (!window.VariableManager) return;
    const isWorship = habitType === 'worship';
    const triggers = isWorship
        ? [{ value: 'done', label: t('mark_done') }]
        : [
            { value: 'committed', label: t('mark_committed') },
            { value: 'avoided', label: t('mark_avoided') }
          ];
    VariableManager.showAssignModal('habit', habitId, triggers, () => {
        updateHabitCard(habitId);
    });
}

window.showHabitVariableModal = showHabitVariableModal;
