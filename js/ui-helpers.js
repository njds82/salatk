// ========================================
// UI Update Helpers (Partial Updates)
// ========================================

const LEVANT_REGIONS = {
    'Syria': [
        { name: 'Damascus', lat: 33.5138, long: 36.2765 },
        { name: 'Aleppo', lat: 36.2021, long: 37.1343 },
        { name: 'Homs', lat: 34.7324, long: 36.7137 },
        { name: 'Hama', lat: 35.1318, long: 36.7578 },
        { name: 'Latakia', lat: 35.5317, long: 35.7901 },
        { name: 'Tartus', lat: 34.8890, long: 35.8866 },
        { name: 'Idlib', lat: 35.9306, long: 36.6339 },
        { name: 'Daraa', lat: 32.6184, long: 36.1023 },
        { name: 'Suwayda', lat: 32.7090, long: 36.5695 },
        { name: 'Deir ez-Zor', lat: 35.3353, long: 40.1511 },
        { name: 'Raqqa', lat: 35.9520, long: 39.0069 },
        { name: 'Hasakah', lat: 36.4947, long: 40.7303 },
        { name: 'Quneitra', lat: 33.1259, long: 35.8248 }
    ],
    'Lebanon': [
        { name: 'Beirut', lat: 33.8938, long: 35.5018 },
        { name: 'Tripoli', lat: 34.4367, long: 35.8497 },
        { name: 'Sidon', lat: 33.5599, long: 35.3756 },
        { name: 'Tyre', lat: 33.2733, long: 35.1939 },
        { name: 'Zahle', lat: 33.8463, long: 35.9020 },
        { name: 'Nabatieh', lat: 33.3667, long: 35.5500 },
        { name: 'Baalbek', lat: 34.0049, long: 36.2109 }
    ],
    'Jordan': [
        { name: 'Amman', lat: 31.9454, long: 35.9284 },
        { name: 'Irbid', lat: 32.5568, long: 35.8469 },
        { name: 'Zarqa', lat: 32.0728, long: 36.0880 },
        { name: 'Mafraq', lat: 32.3392, long: 36.2023 },
        { name: 'Balqa', lat: 32.0306, long: 35.7350 },
        { name: 'Madaba', lat: 31.7197, long: 35.7925 },
        { name: 'Karak', lat: 31.1856, long: 35.7051 },
        { name: 'Tafilah', lat: 30.8384, long: 35.6171 },
        { name: 'Ma\'an', lat: 30.1927, long: 35.7383 },
        { name: 'Aqaba', lat: 29.5319, long: 35.0061 },
        { name: 'Jerash', lat: 32.2747, long: 35.8973 },
        { name: 'Ajloun', lat: 32.3323, long: 35.7513 }
    ],
    'Palestine': [
        { name: 'Jerusalem', lat: 31.7683, long: 35.2137 },
        { name: 'Gaza', lat: 31.5017, long: 34.4668 },
        { name: 'Hebron', lat: 31.5326, long: 35.0998 },
        { name: 'Nablus', lat: 32.2227, long: 35.2621 },
        { name: 'Ramallah', lat: 31.9038, long: 35.2034 },
        { name: 'Jenin', lat: 32.4607, long: 35.2974 },
        { name: 'Jericho', lat: 31.8611, long: 35.4616 },
        { name: 'Bethlehem', lat: 31.7057, long: 35.2007 },
        { name: 'Tulkarm', lat: 32.3129, long: 35.0275 },
        { name: 'Qalqilya', lat: 32.1960, long: 34.9815 }
    ]
};

// Update a single prayer card without reloading the page
async function updatePrayerCard(prayerKey) {
    const dailyPrayers = await PrayerService.getDailyPrayers(window.selectedDate);
    const status = dailyPrayers[prayerKey]?.status || null;

    let prayerTime = null;
    let isTimeValid = true;

    if (window.PrayerManager && isToday(window.selectedDate)) {
        const times = await PrayerManager.getPrayerTimesForToday();
        prayerTime = times[prayerKey];

        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const prayerMinutes = timeToMinutes(prayerTime);

        if (currentMinutes < prayerMinutes) {
            isTimeValid = false;
        }
    }

    const newCardHTML = createPrayerCard(prayerKey, status, prayerTime, isTimeValid);

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

// Global timeout helper for resilient services
window.withTimeout = async function (promise, timeoutMs, timeoutValue = null) {
    let timeoutId;
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
    });
    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(() => clearTimeout(timeoutId));
};

// ========================================
// Global Event Listeners (Dropdowns)
// ========================================

document.addEventListener('click', (e) => {
    // Handle Dropdown Toggles
    if (e.target.closest('.options-btn')) {
        const btn = e.target.closest('.options-btn');
        const menu = btn.nextElementSibling;
        if (menu && menu.classList.contains('dropdown-menu')) {
            // Close all other open dropdowns
            document.querySelectorAll('.options-menu.active').forEach(m => {
                if (m !== btn.parentElement) m.classList.remove('active');
            });
            btn.parentElement.classList.toggle('active');
            e.stopPropagation();
        }
    } else {
        // Close all dropdowns when clicking outside
        document.querySelectorAll('.options-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

