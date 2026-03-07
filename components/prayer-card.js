// ========================================
// Prayer Card Component
// ========================================

function getPrayerVariableBadge(prayerKey) {
    if (!window.VariableService) return '';
    const link = VariableService.getForElement('prayer', prayerKey);
    if (!link) return '';
    return `<span class="variable-badge" onclick="showPrayerVariableModal('${prayerKey}')" title="${t('enter_variable')}">🔗 ${link.variable}</span>`;
}

function createPrayerCard(prayerKey, status = null, prayerTime = null, isTimeValid = true, disabledMessage = null) {
    const prayer = PRAYERS[prayerKey];
    const prayerName = t(prayer.nameKey);
    const rakaatText = prayer.rakaat > 0
        ? `${prayer.rakaat} ${prayer.rakaat === 1 ? t('rakaat') : t('rakaat_plural')}`
        : `${t('rakaat')} ${t('variable')}`;
    const pointsText = `${prayer.points > 0 ? '+' : ''}${prayer.points} ${prayer.points === 1 ? t('points') : t('points_plural')}`;

    const statusClass = status ? status : '';
    const isDone = status === 'done';
    const isMissed = status === 'missed';
    const hasStatus = isDone || isMissed; // Any status selected - disable both buttons

    // If time is not valid, we disable interactions
    const isDisabled = !isTimeValid;
    const clickHandler = isDisabled ? `showToast('${disabledMessage || t('prayer_time_not_reached')}', 'warning')` : '';

    const variableBadge = getPrayerVariableBadge(prayerKey);

    return `
        <div class="prayer-card ${statusClass}">
            <div class="prayer-header">
                <div class="prayer-info">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
                        <h3>${prayerName}</h3>
                        ${variableBadge}
                        <div class="options-menu">
                            <button class="options-btn">
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <path d="M10 6 C11 6 11 10 10 10 C9 10 9 6 10 6 M10 14 C11 14 11 18 10 18 C9 18 9 14 10 14 M10 -2 C11 -2 11 2 10 2 C9 2 9 -2 10 -2" transform="translate(0, 4)" stroke="currentColor" stroke-width="2" fill="none"/>
                                </svg>
                            </button>
                            <div class="dropdown-menu">
                                <button class="dropdown-item" onclick="${isDisabled ? clickHandler : `handlePrayerPerformed('${prayerKey}')`}" ${isDisabled ? 'style="opacity: 0.5"' : ''}>
                                    <span style="color: var(--color-success)">●</span> ${t('performed')}
                                </button>
                                <button class="dropdown-item" onclick="${isDisabled ? clickHandler : `handlePrayerMissed('${prayerKey}')`}" ${isDisabled ? 'style="opacity: 0.5"' : ''}>
                                    <span style="color: var(--color-error)">●</span> ${t('missed')}
                                </button>
                                <button class="dropdown-item danger" onclick="handleResetPrayer('${prayerKey}')">
                                    <span>↺</span> ${t('reset_decision')}
                                </button>
                                <button class="dropdown-item" onclick="showPrayerVariableModal('${prayerKey}')" style="border-top: 1px solid var(--color-border); margin-top: 4px; padding-top: 8px;">
                                    <span>🔗</span> ${t('enter_variable')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p class="prayer-rakaat">${rakaatText}</p>
                    ${prayerTime ? `<p class="prayer-time" style="color: var(--color-primary); font-weight: bold; margin-top: 4px;">${prayerTime}</p>` : ''}
                </div>
                <span class="prayer-points">${pointsText}</span>
            </div>
            <div class="prayer-actions">
                ${isDisabled ? `
                    <div style="flex: 1; display: flex; gap: var(--spacing-sm);" onclick="${clickHandler}">
                        <button class="btn btn-success" disabled style="pointer-events: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ${t('performed')}
                        </button>
                        <button class="btn btn-danger" disabled style="pointer-events: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            ${t('missed')}
                        </button>
                    </div>
                ` : `
                    <button class="btn btn-success" 
                            onclick="handlePrayerPerformed('${prayerKey}')"
                            ${hasStatus ? 'disabled' : ''}
                            style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ${t('performed')}
                    </button>
                    <button class="btn btn-danger" 
                            onclick="handlePrayerMissed('${prayerKey}')"
                            ${hasStatus ? 'disabled' : ''}
                            style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        ${t('missed')}
                    </button>
                `}
            </div>
        </div>
    `;
}

function showPrayerVariableModal(prayerKey) {
    if (!window.VariableManager) return;
    const triggers = [
        { value: 'done', label: t('performed') },
        { value: 'missed', label: t('missed') }
    ];
    VariableManager.showAssignModal('prayer', prayerKey, triggers, () => {
        updatePrayerCard(prayerKey);
    });
}

async function handleResetPrayer(prayerKey) {
    try {
        if (!canEditDate(window.selectedDate)) {
            showToast(t('last_7_days_only'), 'error');
            return;
        }
        const result = await PrayerService.resetPrayer(prayerKey, window.selectedDate);
        if (result.success) {
            showToast(t('undo_success'), 'info');
            await updatePointsDisplay();
            await updatePrayerCard(prayerKey);
        }
    } catch (error) {
        console.error('Error in handleResetPrayer:', error);
        showToast(t('error_general'), 'error');
    }
}
