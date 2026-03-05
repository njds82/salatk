// ========================================
// Time Management Page
// ========================================

window.timePlanView = window.timePlanView || localStorage.getItem('salatk_time_plan_view') || 'daily';
window.timePlanDate = window.timePlanDate || getCurrentDate();

const TIME_PLAN_WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function escapeTimePlanText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizePlanTime(timeStr) {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return '';
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
    const normalized = normalizePlanTime(timeStr);
    if (!normalized) return 0;
    const [h, m] = normalized.split(':').map(Number);
    return h * 60 + m;
}

function getWeekdayLabel(index) {
    const key = TIME_PLAN_WEEKDAY_KEYS[index] || 'sunday';
    return t(key);
}

function setTimePlanView(view) {
    const safeView = view === 'weekly' ? 'weekly' : 'daily';
    window.timePlanView = safeView;
    localStorage.setItem('salatk_time_plan_view', safeView);
    renderPage('time-management', true);
}

function setTimePlanDate(dateStr) {
    window.timePlanDate = dateStr;
    renderPage('time-management', true);
}

function handleTimePlanDateChange(dateStr) {
    if (!dateStr) return;
    setTimePlanDate(dateStr);
}

function handleTimePlanPrevDay() {
    const date = parseDate(window.timePlanDate);
    date.setDate(date.getDate() - 1);
    setTimePlanDate(formatDate(date));
}

function handleTimePlanNextDay() {
    const date = parseDate(window.timePlanDate);
    date.setDate(date.getDate() + 1);
    setTimePlanDate(formatDate(date));
}

function renderTimePlanTabs(activeView) {
    return `
        <div class="time-plan-tabs">
            <button class="time-plan-tab ${activeView === 'daily' ? 'active' : ''}" onclick="setTimePlanView('daily')">
                ${t('time_management_daily')}
            </button>
            <button class="time-plan-tab ${activeView === 'weekly' ? 'active' : ''}" onclick="setTimePlanView('weekly')">
                ${t('time_management_weekly')}
            </button>
        </div>
    `;
}

function getPrayerSections(prayerTimes) {
    if (!prayerTimes) {
        return [
            {
                key: 'all_day',
                label: t('time_management_section_all_day'),
                start: '00:00',
                end: '23:59'
            }
        ];
    }

    const safeTimes = {
        fajr: normalizePlanTime(prayerTimes.fajr),
        duha: normalizePlanTime(prayerTimes.duha),
        dhuhr: normalizePlanTime(prayerTimes.dhuhr),
        asr: normalizePlanTime(prayerTimes.asr),
        maghrib: normalizePlanTime(prayerTimes.maghrib),
        isha: normalizePlanTime(prayerTimes.isha)
    };

    if (!safeTimes.fajr || !safeTimes.dhuhr || !safeTimes.asr || !safeTimes.maghrib || !safeTimes.isha) {
        return [
            {
                key: 'all_day',
                label: t('time_management_section_all_day'),
                start: '00:00',
                end: '23:59'
            }
        ];
    }

    return [
        {
            key: 'before_fajr',
            label: t('time_management_section_before_fajr'),
            start: '00:00',
            end: safeTimes.fajr
        },
        {
            key: 'fajr_to_duha',
            label: t('time_management_section_fajr_to_duha'),
            start: safeTimes.fajr,
            end: safeTimes.duha
        },
        {
            key: 'duha_to_dhuhr',
            label: t('time_management_section_duha_to_dhuhr'),
            start: safeTimes.duha,
            end: safeTimes.dhuhr
        },
        {
            key: 'dhuhr_to_asr',
            label: t('time_management_section_dhuhr_to_asr'),
            start: safeTimes.dhuhr,
            end: safeTimes.asr
        },
        {
            key: 'asr_to_maghrib',
            label: t('time_management_section_asr_to_maghrib'),
            start: safeTimes.asr,
            end: safeTimes.maghrib
        },
        {
            key: 'maghrib_to_isha',
            label: t('time_management_section_maghrib_to_isha'),
            start: safeTimes.maghrib,
            end: safeTimes.isha
        },
        {
            key: 'after_isha',
            label: t('time_management_section_after_isha'),
            start: safeTimes.isha,
            end: '23:59'
        }
    ];
}

function getSectionForPlan(plan, sections) {
    const startMinutes = timeToMinutes(plan.startTime);
    for (const section of sections) {
        const start = timeToMinutes(section.start);
        const end = timeToMinutes(section.end || '23:59');
        if (startMinutes >= start && startMinutes < end) {
            return section.key;
        }
    }
    return sections[sections.length - 1]?.key || 'all_day';
}

function renderPrayerTimesRow(prayerTimes) {
    if (!prayerTimes) {
        return `
            <div class="time-plan-empty">
                ${t('time_management_no_prayer_times')}
            </div>
        `;
    }

    const entries = [
        { key: 'fajr', time: prayerTimes.fajr },
        { key: 'duha', time: prayerTimes.duha },
        { key: 'dhuhr', time: prayerTimes.dhuhr },
        { key: 'asr', time: prayerTimes.asr },
        { key: 'maghrib', time: prayerTimes.maghrib },
        { key: 'isha', time: prayerTimes.isha }
    ];

    return `
        <div class="time-plan-prayer-row">
            ${entries.map(entry => `
                <div class="time-plan-prayer-chip">
                    <span class="time-plan-prayer-label">${t(entry.key)}</span>
                    <span class="time-plan-prayer-time">${normalizePlanTime(entry.time)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTimePlanCard(plan) {
    return `
        <div class="card time-plan-card" data-plan-id="${plan.id}">
            <div class="time-plan-card-header">
                <div class="time-plan-card-time">${normalizePlanTime(plan.startTime)} - ${normalizePlanTime(plan.endTime)}</div>
                <div class="time-plan-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditTimePlanModal('${plan.id}')">${t('edit')}</button>
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteTimePlan('${plan.id}')">${t('delete')}</button>
                </div>
            </div>
            <h3 class="time-plan-card-title">${escapeTimePlanText(plan.title)}</h3>
            ${plan.notes ? `<p class="time-plan-card-notes">${escapeTimePlanText(plan.notes)}</p>` : ''}
        </div>
    `;
}

function renderDailySections(plans, sections) {
    if (!plans || plans.length === 0) {
        return `<div class="time-plan-empty">${t('time_management_empty_daily')}</div>`;
    }

    const grouped = {};
    plans.forEach(plan => {
        const key = getSectionForPlan(plan, sections);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(plan);
    });

    return sections
        .filter(section => (grouped[section.key] || []).length > 0)
        .map(section => {
            const items = grouped[section.key] || [];
            const rangeText = section.start && section.end
                ? `${normalizePlanTime(section.start)} - ${normalizePlanTime(section.end)}`
                : '';

            return `
                <div class="time-plan-section">
                    <div class="time-plan-section-header">
                        <div class="time-plan-section-title">${section.label}</div>
                        ${rangeText ? `<div class="time-plan-section-range">${rangeText}</div>` : ''}
                    </div>
                    ${items.map(plan => renderTimePlanCard(plan)).join('')}
                </div>
            `;
        }).join('');
}

async function renderDailyTimePlan(prayerTimes) {
    const selectedDate = window.timePlanDate || getCurrentDate();
    const dailyPlans = await TimePlanService.getDailyPlans(selectedDate);
    const sections = getPrayerSections(prayerTimes);

    return `
        <div class="date-navigation">
            <div class="date-nav-controls" style="display: flex; align-items: center; gap: var(--spacing-md); width: 100%; justify-content: space-between;">
                <div class="date-nav-item">
                    <button class="icon-btn" onclick="handleTimePlanPrevDay()" title="${t('previous_day')}">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    </button>
                </div>
                <div class="date-info" style="flex: 1;">
                    <label class="date-picker-label" for="timePlanDatePicker" style="justify-content: center;">
                        ${formatDisplayDate(selectedDate)}
                        <input type="date" id="timePlanDatePicker" value="${selectedDate}"
                               onchange="handleTimePlanDateChange(this.value)" style="position: absolute; opacity: 0; pointer-events: none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" fill="currentColor"/></svg>
                    </label>
                </div>
                <div class="date-nav-item">
                    <button class="icon-btn" onclick="handleTimePlanNextDay()" title="${t('next_day')}">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    </button>
                </div>
            </div>
        </div>

        <div class="time-plan-toolbar">
            <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="showAddTimePlanModal('daily')">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${t('time_management_add')}
                </button>
                <button class="btn btn-secondary" onclick="handleCopyWeeklyToDay()">
                    ${t('time_management_copy_weekly')}
                </button>
            </div>
        </div>

        <div>
            <h3 style="margin: 0 0 var(--spacing-md);">${t('time_management_prayer_times')}</h3>
            ${renderPrayerTimesRow(prayerTimes)}
        </div>

        ${renderDailySections(dailyPlans, sections)}
    `;
}

async function renderWeeklyTimePlan() {
    const weeklyPlans = await TimePlanService.getWeeklyPlans();
    const grouped = {};

    weeklyPlans.forEach(plan => {
        const day = plan.weekday;
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(plan);
    });

    return TIME_PLAN_WEEKDAY_KEYS.map((key, index) => {
        const items = grouped[index] || [];
        const sorted = items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        return `
            <div class="time-plan-weekday">
                <div class="time-plan-weekday-header">
                    <h3 class="time-plan-section-title">${t(key)}</h3>
                    <button class="btn btn-secondary btn-sm" onclick="showAddTimePlanModal('weekly', ${index})">
                        ${t('time_management_add')}
                    </button>
                </div>
                ${sorted.length === 0
                    ? `<div class="time-plan-empty">${t('time_management_empty_weekly')}</div>`
                    : sorted.map(plan => renderTimePlanCard(plan)).join('')
                }
            </div>
        `;
    }).join('');
}

async function renderTimeManagementPage() {
    const view = window.timePlanView || 'daily';
    const selectedDate = window.timePlanDate || getCurrentDate();
    let prayerTimes = null;

    if (view === 'daily' && window.PrayerManager) {
        prayerTimes = await PrayerManager.getPrayerTimesForDate(selectedDate);
    }

    const body = view === 'daily'
        ? await renderDailyTimePlan(prayerTimes)
        : await renderWeeklyTimePlan();

    return `
        <div id="time-management-page">
            <div class="page-header">
                <h1 class="page-title">${t('time_management_title')}</h1>
                <p class="page-subtitle">${t('time_management_subtitle')}</p>
            </div>
            ${renderTimePlanTabs(view)}
            ${body}
        </div>
    `;
}

async function showAddTimePlanModal(scope, weekday = null) {
    const safeScope = scope === 'weekly' ? 'weekly' : 'daily';
    const selectedDate = window.timePlanDate || getCurrentDate();
    const prayerTimes = window.PrayerManager
        ? await PrayerManager.getPrayerTimesForDate(safeScope === 'daily' ? selectedDate : getCurrentDate())
        : null;

    const heading = safeScope === 'daily'
        ? formatDisplayDate(selectedDate)
        : getWeekdayLabel(weekday);

    const content = renderTimePlanModalContent({
        title: '',
        notes: '',
        startTime: '',
        endTime: '',
        prayerTimes,
        heading
    });

    showModal(
        t('time_management_add'),
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
                onclick: () => handleCreateTimePlan(safeScope, weekday)
            }
        ]
    );
}

async function showEditTimePlanModal(planId) {
    const plan = await TimePlanService.getPlanById(planId);
    if (!plan) return;

    const prayerTimes = window.PrayerManager
        ? await PrayerManager.getPrayerTimesForDate(plan.scope === 'daily' ? plan.date : getCurrentDate())
        : null;

    const heading = plan.scope === 'daily'
        ? formatDisplayDate(plan.date)
        : getWeekdayLabel(plan.weekday);

    const content = renderTimePlanModalContent({
        title: plan.title,
        notes: plan.notes || '',
        startTime: plan.startTime,
        endTime: plan.endTime,
        prayerTimes,
        heading
    });

    showModal(
        t('edit'),
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
                onclick: () => handleUpdateTimePlan(planId)
            }
        ]
    );
}

function renderTimePlanModalContent({ title, notes, startTime, endTime, prayerTimes, heading }) {
    const prayerEntries = prayerTimes
        ? [
            { key: 'fajr', time: prayerTimes.fajr },
            { key: 'duha', time: prayerTimes.duha },
            { key: 'dhuhr', time: prayerTimes.dhuhr },
            { key: 'asr', time: prayerTimes.asr },
            { key: 'maghrib', time: prayerTimes.maghrib },
            { key: 'isha', time: prayerTimes.isha }
        ]
        : [];

    const renderQuickButtons = (inputId) => {
        if (!prayerEntries.length) return '';
        return `
            <div class="time-plan-quick-row">
                ${prayerEntries.map(entry => `
                    <button class="time-plan-quick-btn" type="button" onclick="fillTimePlanInput('${inputId}', '${normalizePlanTime(entry.time)}')">
                        ${t(entry.key)} • ${normalizePlanTime(entry.time)}
                    </button>
                `).join('')}
            </div>
        `;
    };

    return `
        <div class="form-group">
            <div style="font-weight: 700; margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);">${heading}</div>
        </div>
        <div class="form-group">
            <label class="form-label" for="timePlanTitleInput">${t('time_management_title_label')}</label>
            <input type="text" class="form-input" id="timePlanTitleInput" maxlength="140" value="${escapeTimePlanText(title)}" placeholder="${t('time_management_title_placeholder')}">
        </div>
        <div class="form-group">
            <label class="form-label" for="timePlanNotesInput">${t('time_management_notes_label')}</label>
            <textarea class="form-input" id="timePlanNotesInput" rows="3">${escapeTimePlanText(notes)}</textarea>
        </div>
        <div class="form-group time-plan-time-row">
            <div>
                <label class="form-label" for="timePlanStartInput">${t('time_management_time_from')}</label>
                <input type="time" class="form-input" id="timePlanStartInput" value="${normalizePlanTime(startTime)}">
            </div>
            <div>
                <label class="form-label" for="timePlanEndInput">${t('time_management_time_to')}</label>
                <input type="time" class="form-input" id="timePlanEndInput" value="${normalizePlanTime(endTime)}">
            </div>
        </div>
        <div class="time-plan-quick-fill">
            <div class="time-plan-quick-title">${t('time_management_fill_start')}</div>
            ${renderQuickButtons('timePlanStartInput')}
            <div class="time-plan-quick-title" style="margin-top: var(--spacing-md);">${t('time_management_fill_end')}</div>
            ${renderQuickButtons('timePlanEndInput')}
        </div>
    `;
}

function fillTimePlanInput(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) input.value = value;
}

async function handleCreateTimePlan(scope, weekday = null) {
    const title = document.getElementById('timePlanTitleInput')?.value?.trim() || '';
    const notes = document.getElementById('timePlanNotesInput')?.value?.trim() || '';
    const startTime = document.getElementById('timePlanStartInput')?.value || '';
    const endTime = document.getElementById('timePlanEndInput')?.value || '';

    if (!title) {
        showToast(t('time_management_title_required'), 'error');
        return;
    }

    if (!startTime) {
        showToast(t('time_management_start_required'), 'error');
        return;
    }

    if (!endTime) {
        showToast(t('time_management_end_required'), 'error');
        return;
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        showToast(t('time_management_time_order_invalid'), 'error');
        return;
    }

    try {
        await TimePlanService.createPlan({
            scope,
            date: scope === 'daily' ? window.timePlanDate : null,
            weekday: scope === 'weekly' ? weekday : null,
            title,
            notes,
            startTime,
            endTime
        });

        showToast(t('time_management_create_success'), 'success');
        closeModal();
        renderPage('time-management', true);
    } catch (error) {
        console.error('Time plan create failed', error);
        showToast(t('error_general'), 'error');
    }
}

async function handleUpdateTimePlan(planId) {
    const title = document.getElementById('timePlanTitleInput')?.value?.trim() || '';
    const notes = document.getElementById('timePlanNotesInput')?.value?.trim() || '';
    const startTime = document.getElementById('timePlanStartInput')?.value || '';
    const endTime = document.getElementById('timePlanEndInput')?.value || '';

    if (!title) {
        showToast(t('time_management_title_required'), 'error');
        return;
    }

    if (!startTime) {
        showToast(t('time_management_start_required'), 'error');
        return;
    }

    if (!endTime) {
        showToast(t('time_management_end_required'), 'error');
        return;
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        showToast(t('time_management_time_order_invalid'), 'error');
        return;
    }

    try {
        await TimePlanService.updatePlan(planId, {
            title,
            notes,
            startTime,
            endTime
        });

        showToast(t('time_management_update_success'), 'success');
        closeModal();
        renderPage('time-management', true);
    } catch (error) {
        console.error('Time plan update failed', error);
        showToast(t('error_general'), 'error');
    }
}

async function handleDeleteTimePlan(planId) {
    confirmDialog(t('time_management_delete_confirm'), async () => {
        const success = await TimePlanService.deletePlan(planId);
        if (success) {
            showToast(t('time_management_delete_success'), 'success');
            renderPage('time-management', true);
        } else {
            showToast(t('error_general'), 'error');
        }
    });
}

async function handleCopyWeeklyToDay() {
    confirmDialog(t('time_management_copy_confirm'), async () => {
        try {
            await TimePlanService.replaceDailyWithWeekly(window.timePlanDate || getCurrentDate());
            showToast(t('time_management_copy_success'), 'success');
            renderPage('time-management', true);
        } catch (error) {
            console.error('Copy weekly to day failed', error);
            showToast(t('error_general'), 'error');
        }
    });
}

window.renderTimeManagementPage = renderTimeManagementPage;
window.setTimePlanView = setTimePlanView;
window.handleTimePlanDateChange = handleTimePlanDateChange;
window.handleTimePlanPrevDay = handleTimePlanPrevDay;
window.handleTimePlanNextDay = handleTimePlanNextDay;
window.showAddTimePlanModal = showAddTimePlanModal;
window.showEditTimePlanModal = showEditTimePlanModal;
window.handleDeleteTimePlan = handleDeleteTimePlan;
window.handleCopyWeeklyToDay = handleCopyWeeklyToDay;
window.fillTimePlanInput = fillTimePlanInput;
