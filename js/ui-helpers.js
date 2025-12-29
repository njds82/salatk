// ========================================
// UI Update Helpers (Partial Updates)
// ========================================

// Update a single prayer card without reloading the page
async function updatePrayerCard(prayerKey) {
    const dailyPrayers = await PrayerService.getDailyPrayers(window.selectedDate);
    const status = dailyPrayers[prayerKey]?.status || null;

    let prayerTime = null;
    if (window.PrayerManager && isToday(window.selectedDate)) {
        const times = await PrayerManager.getPrayerTimesForToday();
        prayerTime = times[prayerKey];
    }

    const newCardHTML = createPrayerCard(prayerKey, status, prayerTime);

    // Find and replace the prayer card in the DOM
    const cardGrid = document.querySelector('.card-grid');
    if (cardGrid) {
        const allCards = cardGrid.querySelectorAll('.prayer-card');
        const prayerIndex = Object.keys(PRAYERS).indexOf(prayerKey);
        if (allCards[prayerIndex]) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newCardHTML;
            allCards[prayerIndex].replaceWith(tempDiv.firstElementChild);
        }
    }
}

// Update a single habit card without reloading the page
async function updateHabitCard(habitId) {
    const habits = await HabitService.getAll();
    const habit = habits.find(h => h.id === habitId);

    if (!habit) return;

    const newCardHTML = await createHabitCard(habit);

    // Find and replace the habit card in the DOM
    const cardGrid = document.querySelector('.card-grid');
    if (cardGrid) {
        const allCards = cardGrid.querySelectorAll('.card');
        for (let card of allCards) {
            const deleteBtn = card.querySelector(`[onclick*="handleDeleteHabit('${habitId}')"]`);
            if (deleteBtn) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newCardHTML;
                card.replaceWith(tempDiv.firstElementChild);
                break;
            }
        }
    }
}

// Refresh qada prayers section without full reload
async function refreshQadaList() {
    const qadaPrayers = await getQadaPrayers();
    const totalRakaat = qadaPrayers.reduce((sum, prayer) => sum + prayer.rakaat, 0);

    // Update total rakaat display
    const totalDisplay = document.querySelector('.card h2');
    if (totalDisplay && totalDisplay.textContent.match(/^\d+$/)) {
        totalDisplay.textContent = totalRakaat;
    }

    // Update the qada list
    const cardGrid = document.querySelector('.card-grid');
    if (!cardGrid) return;

    if (qadaPrayers.length === 0) {
        // Show empty state
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            navigateTo('qada-prayers'); // Only reload if list becomes empty
        }
    } else {
        // Rebuild the grid
        let html = '';
        qadaPrayers.forEach(qadaPrayer => {
            const prayer = PRAYERS[qadaPrayer.prayer];
            const displayDate = qadaPrayer.date === 'unknown'
                ? t('date_unknown')
                : formatDisplayDate(qadaPrayer.date);

            html += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                        <div>
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                <h3 style="font-size: 1.25rem; margin: 0;">${t(prayer.nameKey)}</h3>
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
        });

        cardGrid.innerHTML = html;
    }
}

window.updatePrayerCard = updatePrayerCard;
window.updateHabitCard = updateHabitCard;
window.refreshQadaList = refreshQadaList;
