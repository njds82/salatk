// ========================================
// Daily Prayers Page
// ========================================

let interactionCheckInterval = null;

async function renderDailyPrayersPage() {
    const today = getCurrentDate();
    const hijriDate = getHijriDate(parseDate(selectedDate));
    const dailyPrayers = await PrayerService.getDailyPrayers(selectedDate);

    // Get fetched times
    let prayerTimes = null;
    let isTodayDate = false;

    if (window.PrayerManager) {
        // We use isToday helper if available, or manual check string comparison
        isTodayDate = selectedDate === today;
        if (isTodayDate) {
            prayerTimes = await PrayerManager.getPrayerTimesForToday();
        }
    }

    // Helper to parse "HH:MM" to minutes
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('daily_prayers_title')}</h1>
            <p class="page-subtitle">${t('daily_prayers_subtitle')}</p>
        </div>

        <div class="date-navigation">
            <div class="date-nav-controls" style="display: flex; align-items: center; gap: var(--spacing-md); width: 100%; justify-content: space-between;">
                <div class="date-nav-item">
                    <button class="icon-btn" onclick="handlePrevDay()" title="${t('previous_day')}">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    </button>
                </div>
                <div class="date-info" style="flex: 1;">
                    <label class="date-picker-label" for="datePicker" style="justify-content: center;">
                        ${formatDisplayDate(selectedDate)} - ${hijriDate.formatted}
                        <input type="date" id="datePicker" value="${selectedDate}" max="${today}" 
                               onchange="handleDateChange(this.value)" style="position: absolute; opacity: 0; pointer-events: none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" fill="currentColor"/></svg>
                    </label>
                    ${!canEditDate(selectedDate) ? `<p style="color: var(--color-error); font-size: 0.75rem; margin-top: 4px;">${t('last_7_days_only')}</p>` : ''}
                </div>
                <div class="date-nav-item">
                    <button class="icon-btn" onclick="handleNextDay()" ${selectedDate === today ? 'disabled' : ''} title="${t('next_day')}">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card-grid" id="prayer-cards-container">
    `;

    // Render all prayers
    for (const prayerKey of Object.keys(PRAYERS)) {
        const status = dailyPrayers[prayerKey]?.status || null;
        let timeDisplay = null;
        let isTimeValid = true; // Default true (for past days)

        if (prayerTimes && prayerTimes[prayerKey]) {
            timeDisplay = prayerTimes[prayerKey];

            // Only validate time if viewing TODAY's list
            if (isTodayDate) {
                const prayerMinutes = timeToMinutes(timeDisplay);
                // Allow interaction if current time >= prayer time
                // Or if it's already 'done'/'missed' (handled inside createPrayerCard logic mostly to show status, 
                // but checking here ensures we don't accidentally disable a completed prayer if logic changes)
                // Actually, if it's NOT time yet, it shouldn't be 'done' technically, but if user manually set it maybe? 
                // Requirement says: disable if time is BEFORE prayer time.
                if (currentMinutes < prayerMinutes) {
                    isTimeValid = false;
                }
            }
        }

        html += createPrayerCard(prayerKey, status, timeDisplay, isTimeValid).replace('class="prayer-card', `data-prayer="${prayerKey}" class="prayer-card`);
    }

    html += `</div>`;

    // Start auto-refresh interval for Today view
    if (interactionCheckInterval) clearInterval(interactionCheckInterval);
    if (isTodayDate) {
        interactionCheckInterval = setInterval(() => {
            // Re-check times without full re-render if possible, or just call updatePrayerCard loop
            // For simplicity, we can just iterate and call updatePrayerCard if status might change
            // But updatePrayerCard does async fetch. Maybe better to just re-render page quietly? 
            // Or update the specific changed cards.
            // Let's iterate keys and call updatePrayerCard - it handles fetching fresh state.
            Object.keys(PRAYERS).forEach(key => updatePrayerCard(key));
        }, 60000); // Check every minute
    }

    return html;
}

// Navigation Handlers
function handleDateChange(date) {
    setSelectedDate(date);
}

function handlePrevDay() {
    const date = parseDate(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDate(date));
}

function handleNextDay() {
    const today = getCurrentDate();
    if (selectedDate === today) return;
    const date = parseDate(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDate(date));
}

// Helper to update card UI immediately
function optimisticUpdateCard(prayerKey, status) {
    const card = document.querySelector(`.prayer-card[data-prayer="${prayerKey}"]`);
    if (!card) return;

    // Remove old classes
    card.classList.remove('done', 'missed');

    // Add new status class if applicable
    if (status === 'done') card.classList.add('done');
    if (status === 'missed') card.classList.add('missed');

    // Update buttons UI (Optional: could disable them or show spinner)
    // For now, the visual change of the card is feedback enough.
}

// Handle prayer performed
async function handlePrayerPerformed(prayerKey) {
    if (!canEditDate(window.selectedDate)) {
        showToast(t('last_7_days_only'), 'error');
        return;
    }

    // Capture previous state in case of revert
    // (This is tricky without state management, we assume reset on failure)

    try {
        // Optimistic UI Update
        optimisticUpdateCard(prayerKey, 'done');

        // Background Service Call
        const result = await PrayerService.markPrayer(prayerKey, window.selectedDate, 'done');

        if (result.success) {
            showToast(t('prayer_performed_message'), 'success');
            await updatePointsDisplay();
            // We call updatePrayerCard just to ensure points/details are synced, 
            // but the visual state 'done' is already there.
            await updatePrayerCard(prayerKey);
        } else {
            throw new Error(t('error_general'));
        }
    } catch (error) {
        console.error('Error in handlePrayerPerformed:', error);
        showToast(t('error_general'), 'error');
        // Revert UI by refreshing the card
        await updatePrayerCard(prayerKey);
    }
}

// Handle prayer missed
async function handlePrayerMissed(prayerKey) {
    if (!canEditDate(window.selectedDate)) {
        showToast(t('last_7_days_only'), 'error');
        return;
    }

    try {
        // Optimistic UI Update
        optimisticUpdateCard(prayerKey, 'missed');

        const result = await PrayerService.markPrayer(prayerKey, window.selectedDate, 'missed');

        if (result.success) {
            showToast(t('prayer_missed_message'), 'warning');
            await updatePointsDisplay();
            await updatePrayerCard(prayerKey);
        } else {
            throw new Error(t('error_general'));
        }
    } catch (error) {
        console.error('Error in handlePrayerMissed:', error);
        showToast(t('error_general'), 'error');
        // Revert UI
        await updatePrayerCard(prayerKey);
    }
}

