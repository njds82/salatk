// ========================================
// Habits Page
// ========================================

async function renderHabitsPage() {
    const [habits, habitsMeta] = await Promise.all([
        HabitService.getAll(),
        HabitService.getHabitsCardMeta(selectedDate)
    ]);
    const today = getCurrentDate();
    const hijriDate = getHijriDate(parseDate(selectedDate));

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('habits_title')}</h1>
            <p class="page-subtitle">${t('habits_subtitle')}</p>
        </div>
        
        <div class="date-navigation" style="margin-bottom: var(--spacing-xl);">
            <div class="date-nav-item">
                <button class="icon-btn" onclick="handlePrevDay()" title="${t('previous_day')}">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                </button>
            </div>
            <div class="date-info">
                <label class="date-picker-label" for="datePicker">
                    ${formatDisplayDate(selectedDate)} - ${hijriDate.formatted}
                    <input type="date" id="datePicker" value="${selectedDate}" max="${today}" 
                           onchange="handleDateChange(this.value)" style="position: absolute; opacity: 0; pointer-events: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" fill="currentColor"/></svg>
                </label>
            </div>
            <div class="date-nav-item">
                <button class="icon-btn" onclick="handleNextDay()" ${selectedDate === today ? 'disabled' : ''} title="${t('next_day')}">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                </button>
            </div>
        </div>

        <div style="margin-bottom: var(--spacing-xl);">
            <button class="btn btn-primary" onclick="showAddHabitModal()">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${t('add_new_habit')}
            </button>
        </div>
    `;

    if (habits.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <p class="empty-state-text">${t('no_habits')}</p>
                <p style="color: var(--color-text-tertiary);">${t('habits_empty_message')}</p>
            </div>
        `;
    } else {
        html += `<div class="card-grid">`;
        for (const habit of habits) {
            const cardMeta = {
                todayStatus: habitsMeta.statusByHabitId[habit.id] || null,
                streak: habitsMeta.streakByHabitId[habit.id] || 0
            };
            html += await createHabitCard(habit, cardMeta);
        }
        html += `</div>`;
    }

    return html;
}

// Show add habit modal
function showAddHabitModal() {
    let formContent = `
        <div class="form-group">
            <label class="form-label">${t('habit_name')}</label>
            <input type="text" class="form-input" id="habitNameInput" placeholder="${t('habit_name')}">
        </div>
        <div class="form-group">
            <label class="form-label">${t('habit_type')}</label>
            <select class="form-select" id="habitTypeSelect">
                <option value="worship">${t('worship_habit')}</option>
                <option value="sin">${t('sin_habit')}</option>
            </select>
        </div>
    `;

    // Append suggestions (easier than injecting inside the template string cleanly with replace)
    formContent += `
        <div style="margin-top: 15px; border-top: 1px solid var(--color-border); padding-top: 15px;">
            <p style="margin-bottom: 10px; font-size: 0.9em; color: var(--color-text-secondary);">${t('suggested_habits') || 'Suggested Habits'}:</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" style="padding: 4px 8px; font-size: 0.85em;" class="btn btn-secondary" onclick="setHabitInput('${t('duha')}', 'worship')">${t('duha')}</button>
                <button type="button" style="padding: 4px 8px; font-size: 0.85em;" class="btn btn-secondary" onclick="setHabitInput('${t('qiyam')}', 'worship')">${t('qiyam')}</button>
            </div>
        </div>
    `;

    window.setHabitInput = (name, type) => {
        const nameInput = document.getElementById('habitNameInput');
        const typeSelect = document.getElementById('habitTypeSelect');
        if (nameInput) nameInput.value = name;
        if (typeSelect) typeSelect.value = type;
    };

    showModal(
        t('add_new_habit'),
        formContent,
        [
            {
                label: t('cancel'),
                className: 'btn-secondary',
                onclick: () => closeModal()
            },
            {
                label: t('save'),
                className: 'btn-primary',
                onclick: () => handleAddHabit()
            }
        ]
    );
}

// Handle add habit
async function handleAddHabit() {
    const name = document.getElementById('habitNameInput').value.trim();
    const type = document.getElementById('habitTypeSelect').value;

    if (!name) {
        showToast(t('habit_name') + ' ' + t('required'), 'error');
        return;
    }

    try {
        await HabitService.add(name, type);
        showToast(t('habit_added_message'), 'success');
        closeModal();
        navigateTo('habits');
    } catch (error) {
        console.error('Error adding habit:', error);
        showToast(t('error_general'), 'error');
    }
}

// Handle mark habit
async function handleMarkHabit(habitId, action) {
    try {
        if (!canEditDate(window.selectedDate)) {
            showToast(t('last_7_days_only'), 'error');
            return;
        }
        await HabitService.logAction(habitId, window.selectedDate, action);
        showToast(t('habit_marked_message'), 'success');
        await updatePointsDisplay();
        await updateHabitCard(habitId);
    } catch (error) {
        console.error('Error in handleMarkHabit:', error);
        showToast(t('error_general'), 'error');
    }
}

function renderHabitStatsSection(titleKey, stats) {
    const statItems = stats.items || [];
    const itemsHtml = statItems.map((item) => {
        let value = item.value;
        if (item.format === 'percent') {
            value = `${value}%`;
        } else if (item.format === 'date') {
            value = value ? formatDisplayDate(value) : t('no_data_yet');
        }

        return `
            <div class="habit-stat-item">
                <span class="habit-stat-label">${t(item.labelKey)}</span>
                <strong class="habit-stat-value">${value}</strong>
            </div>
        `;
    }).join('');

    if (!itemsHtml) {
        return `
            <section class="habit-stats-section">
                <h3>${t(titleKey)}</h3>
                <p class="habit-stats-empty">${t('no_data_yet')}</p>
            </section>
        `;
    }

    return `
        <section class="habit-stats-section">
            <h3>${t(titleKey)}</h3>
            <div class="habit-stats-grid">
                ${itemsHtml}
            </div>
        </section>
    `;
}

async function showHabitDetailsModal(habitId) {
    try {
        const details = await HabitService.getHabitDetailsStats(habitId);
        if (!details || !details.habit) {
            showToast(t('error_general'), 'error');
            return;
        }

        const trend = details.viewModel.trendVsAllTime;
        const trendText = typeof trend === 'number'
            ? `${trend > 0 ? '+' : ''}${trend}%`
            : t('no_trend_data');
        const habitTypeLabel = details.habit.type === 'worship' ? t('worship_habit') : t('sin_habit');
        const trendClass = typeof trend === 'number'
            ? (trend >= 0 ? 'trend-positive' : 'trend-negative')
            : 'trend-neutral';

        const content = `
            <div class="habit-details-modal">
                <div class="habit-details-meta">
                    <span class="habit-details-type">${habitTypeLabel}</span>
                    <span class="habit-details-trend ${trendClass}">
                        ${t('trend_vs_all_time')}: ${trendText}
                    </span>
                </div>
                ${renderHabitStatsSection('all_time_stats', { items: details.viewModel.allTimeItems })}
                ${renderHabitStatsSection('last_30_days', { items: details.viewModel.last30Items })}
            </div>
        `;

        showModal(
            `${t('habit_details')} - ${details.habit.name}`,
            content,
            [
                {
                    label: t('close'),
                    className: 'btn-secondary',
                    onclick: () => closeModal()
                }
            ]
        );
    } catch (error) {
        console.error('Error showing habit details:', error);
        showToast(t('error_general'), 'error');
    }
}

// Handle delete habit
function handleDeleteHabit(habitId) {
    confirmDialog(t('confirm_delete'), async () => {
        try {
            await HabitService.delete(habitId);
            showToast(t('habit_deleted_message'), 'success');
            navigateTo('habits');
        } catch (error) {
            console.error('Error deleting habit:', error);
            showToast(t('error_general'), 'error');
        }
    });
}

window.showHabitDetailsModal = showHabitDetailsModal;
