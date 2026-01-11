// ========================================
// Habits Page
// ========================================

async function renderHabitsPage() {
    const habits = await HabitService.getAll();
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
            html += await createHabitCard(habit);
        }
        html += `</div>`;
    }

    return html;
}

// Show add habit modal
function showAddHabitModal() {
    const formContent = `
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
