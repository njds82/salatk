// ========================================
// Habit Card Component
// ========================================

function createHabitCard(habit) {
    const streak = getHabitStreak(habit.id);
    const todayStatus = habit.history ? habit.history[getCurrentDate()] : null;
    const isWorshipHabit = habit.type === 'worship';

    return `
        <div class="card">
            <div class="habit-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                <div>
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                        <h3 style="margin: 0;">${habit.name}</h3>
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
                            </div>
                        </div>
                    </div>
                    <span style="display: inline-block; padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; background: ${isWorshipHabit ? 'var(--color-worship)' : 'var(--color-sin)'}; color: white;">
                        ${t(habit.type + '_habit')}
                    </span>
                </div>
            </div>
            
            ${streak > 0 ? `
            <div style="display: flex; align-items: center; gap: var(--spacing-xs); margin-bottom: var(--spacing-md); color: var(--color-warning);">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 2 L12 8 L18 9 L13 13 L15 19 L10 15 L5 19 L7 13 L2 9 L8 8 Z" fill="currentColor"/>
                </svg>
                <span style="font-weight: 600;">${streak} ${t('days')}</span>
            </div>
            ` : ''}
            
            <div class="habit-actions" style="display: flex; gap: var(--spacing-sm);">
                ${isWorshipHabit ? `
                    <button class="btn btn-success" 
                            onclick="handleMarkHabit('${habit.id}', 'done')"
                            ${todayStatus === 'done' ? 'disabled' : ''}
                            style="flex: 1;">
                        ${t('mark_done')}
                    </button>
                ` : `
                    <button class="btn btn-danger" 
                            onclick="handleMarkHabit('${habit.id}', 'committed')"
                            ${todayStatus ? 'disabled' : ''}
                            style="flex: 1;">
                        ${t('mark_committed')}
                    </button>
                    <button class="btn btn-success" 
                            onclick="handleMarkHabit('${habit.id}', 'avoided')"
                            ${todayStatus ? 'disabled' : ''}
                            style="flex: 1;">
                        ${t('mark_avoided')}
                    </button>
                `}
            </div>
        </div>
    `;
}

function handleResetHabit(habitId) {
    const result = resetHabitStatus(habitId, selectedDate);
    if (result.success) {
        showToast(t('undo_success'), 'info');
        updatePointsDisplay();
        renderPage(currentPage);
    }
}
