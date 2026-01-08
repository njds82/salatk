// ========================================
// Qada Prayers Page
// ========================================

async function renderQadaPrayersPage() {
    const qadaPrayers = await PrayerService.getQadaPrayers();
    const totalRakaat = qadaPrayers.reduce((sum, prayer) => sum + prayer.rakaat, 0);
    const PRAYERS = PrayerService.getDefinitions();

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('qada_prayers_title')}</h1>
            <p class="page-subtitle">${t('qada_prayers_subtitle')}</p>
        </div>
        
        <div style="margin-bottom: var(--spacing-lg);">
            <button class="btn btn-primary" onclick="showAddQadaModal()">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${t('add_qada_prayer')}
            </button>
        </div>
    `;

    if (qadaPrayers.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-state-icon">🕌</div>
                <p class="empty-state-text">${t('no_qada_prayers')}</p>
                <p style="color: var(--color-text-tertiary);">${t('qada_empty_message')}</p>
            </div>
        `;
    } else {
        html += `
            <div class="card" style="margin-bottom: var(--spacing-lg); text-align: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: white;">
                <h2 style="font-size: 3rem; margin-bottom: var(--spacing-sm);">${totalRakaat}</h2>
                <p style="font-size: 1.25rem; opacity: 0.9;">${t('total_rakaat')}</p>
            </div>
            
            <div class="card-grid">
        `;

        for (const qadaPrayer of qadaPrayers) {
            const prayer = PRAYERS[qadaPrayer.prayer];
            const displayDate = !qadaPrayer.date
                ? t('date_unknown')
                : formatDisplayDate(qadaPrayer.date);

            html += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                        <div>
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                <h3 style="font-size: 1.25rem; margin: 0;">${t(prayer?.nameKey || qadaPrayer.prayer)}</h3>
                                <div class="options-menu">
                                    <button class="options-btn">
                                        <svg width="20" height="20" viewBox="0 0 20 20">
                                            <path d="M10 6 C11 6 11 10 10 10 C9 10 9 6 10 6 M10 14 C11 14 11 18 10 18 C9 18 9 14 10 14 M10 -2 C11 -2 11 2 10 2 C9 2 9 -2 10 -2" transform="translate(0, 4)" stroke="currentColor" stroke-width="2" fill="none"/>
                                        </svg>
                                    </button>
                                    <div class="dropdown-menu">
                                        <button class="dropdown-item danger" onclick="handleRemoveQada('${qadaPrayer.id}')">
                                            <span>🗑</span> ${t('remove_qada')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p style="color: var(--color-text-secondary); font-size: 0.875rem;">
                                ${displayDate}
                            </p>
                            <p style="color: var(--color-text-secondary); margin-top: var(--spacing-xs);">
                                ${qadaPrayer.rakaat} ${qadaPrayer.rakaat === 1 ? t('rakaat') : t('rakaat_plural')}
                            </p>
                        </div>
                    </div>
                    <button class="btn btn-success" onclick="handleMakeUpQada('${qadaPrayer.id}')" style="width: 100%;">
                        ${t('made_up')} (+3 ${t('points_plural')})
                    </button>
                </div>
            `;
        }

        html += `</div>`;
    }

    return html;
}

// Show add qada modal
function showAddQadaModal() {
    const formContent = `
        <div class="form-group">
            <label class="form-label">${t('prayer_type')}</label>
            <select class="form-select" id="qadaPrayerTypeSelect">
                <option value="fajr">${t('fajr')}</option>
                <option value="dhuhr">${t('dhuhr')}</option>
                <option value="asr">${t('asr')}</option>
                <option value="maghrib">${t('maghrib')}</option>
                <option value="isha">${t('isha')}</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">${t('prayer_count')}</label>
            <input type="number" class="form-input" id="qadaPrayerCountInput" 
                   value="1" min="1" max="10000" placeholder="${t('prayer_count')}">
            <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-top: var(--spacing-xs);">
                ${t('add_multiple_hint')}
            </p>
        </div>
        <div class="form-group">
            <label class="form-label">${t('optional_date')}</label>
            <input type="date" class="form-input" id="qadaPrayerDateInput" 
                   max="${getCurrentDate()}" placeholder="${t('optional_date')}">
            <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-top: var(--spacing-xs);">
                ${t('empty_date_hint')}
            </p>
        </div>
    `;

    showModal(
        t('add_qada_prayer'),
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
                onclick: () => handleAddManualQada()
            }
        ]
    );

    // Add listener to disable count if date is selected
    const dateInput = document.getElementById('qadaPrayerDateInput');
    const countInput = document.getElementById('qadaPrayerCountInput');
    if (dateInput && countInput) {
        dateInput.addEventListener('change', () => {
            if (dateInput.value) {
                countInput.value = 1;
                countInput.disabled = true;
            } else {
                countInput.disabled = false;
            }
        });
    }
}

// Handle add manual qada
async function handleAddManualQada() {
    const prayerType = document.getElementById('qadaPrayerTypeSelect').value;
    const count = parseInt(document.getElementById('qadaPrayerCountInput').value);
    const dateInput = document.getElementById('qadaPrayerDateInput').value;

    if (count < 1 || isNaN(count)) {
        showToast(t('invalid_count'), 'error');
        return;
    }

    if (count > 10000) {
        showToast(t('count_too_large'), 'error');
        return;
    }

    // Logic Check: Can't have multiple counts for a specific date
    if (dateInput && count > 1) {
        showToast(t('error_date_count_mismatch') || "Cannot add multiple prayers for a specific date", 'error');
        return;
    }

    try {
        const date = dateInput || null;
        const rakaat = PrayerService.getDefinitions()[prayerType]?.rakaat || 0;
        const result = await PrayerService.addMultipleQada(date, prayerType, rakaat, count, true);

        if (!result || !result.success) {
            throw new Error('Failed to add qada prayer');
        }

        const message = t('added_prayers_success')
            .replace('{count}', count)
            .replace('{prayer}', t(PrayerService.getDefinitions()[prayerType].nameKey));
        showToast(message, 'success');
        closeModal();
        renderPage('qada-prayers', true);
    } catch (error) {
        console.error('Error adding Qada:', error);
        showToast(t('error_general'), 'error');
    }
}

// Handle make up qada prayer
async function handleMakeUpQada(qadaId) {
    confirmDialog(t('confirm'), async () => {
        const result = await PrayerService.makeUpQada(qadaId);
        if (result.success) {
            showToast(t('qada_made_up_message'), 'success');
            await updatePointsDisplay();
            renderPage('qada-prayers', true);
        }
    });
}

// Handle remove qada prayer
async function handleRemoveQada(qadaId) {
    confirmDialog(t('confirm_delete'), async () => {
        const result = await PrayerService.deleteQada(qadaId);
        if (result.success) {
            showToast(t('habit_deleted_message'), 'info');
            renderPage('qada-prayers', true);
        } else {
            showToast(t('error_general'), 'error');
        }
    });
}
