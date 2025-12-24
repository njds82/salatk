// ========================================
// Daily Prayers Page
// ========================================

async function renderDailyPrayersPage() {
    const today = getCurrentDate();
    const hijriDate = getHijriDate(parseDate(selectedDate));
    const dailyPrayers = getDailyPrayers(selectedDate);

    // Get fetched times
    let prayerTimes = null;
    if (window.PrayerManager && isToday(selectedDate)) {
        prayerTimes = await PrayerManager.getPrayerTimesForToday();
    }

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('daily_prayers_title')}</h1>
            <p class="page-subtitle">${t('daily_prayers_subtitle')}</p>
        </div>

        <div class="date-navigation">
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
                ${!canEditDate(selectedDate) ? `<p style="color: var(--color-error); font-size: 0.75rem; margin-top: 4px;">${t('last_7_days_only')}</p>` : ''}
            </div>
            <div class="date-nav-item">
                <button class="icon-btn" onclick="handleNextDay()" ${selectedDate === today ? 'disabled' : ''} title="${t('next_day')}">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                </button>
            </div>
        </div>
        
        <div class="card-grid">
    `;

    // Render all prayers
    Object.keys(PRAYERS).forEach(prayerKey => {
        const status = dailyPrayers[prayerKey]?.status || null;
        let timeDisplay = null;
        if (prayerTimes && prayerTimes[prayerKey]) {
            timeDisplay = prayerTimes[prayerKey];
        }

        html += createPrayerCard(prayerKey, status, timeDisplay);
    });

    html += `</div>`;

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

// Handle prayer performed
function handlePrayerPerformed(prayerKey) {
    if (!canEditDate(selectedDate)) {
        showToast(t('last_7_days_only'), 'error');
        return;
    }
    const result = markPrayerPerformed(prayerKey, selectedDate);
    if (result.success) {
        showToast(t('prayer_performed_message'), 'success');
        updatePointsDisplay();
        renderPage(currentPage);
    }
}

// Handle prayer missed
function handlePrayerMissed(prayerKey) {
    if (!canEditDate(selectedDate)) {
        showToast(t('last_7_days_only'), 'error');
        return;
    }
    const result = markPrayerMissed(prayerKey, selectedDate);
    if (result.success) {
        showToast(t('prayer_missed_message'), 'error');
        updatePointsDisplay();
        renderPage(currentPage);
    }
}
