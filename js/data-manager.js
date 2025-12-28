// ========================================
// Data Manager - LocalStorage Management
// ========================================

const STORAGE_KEY = 'salatk_data';
const DATA_VERSION = '1.3.0';

// Prayer definitions
const PRAYERS = {
    fajr: {
        nameKey: 'fajr',
        rakaat: 2,
        points: 5,
        required: true
    },
    duha: {
        nameKey: 'duha',
        rakaat: 2,
        points: 3,
        required: false
    },
    dhuhr: {
        nameKey: 'dhuhr',
        rakaat: 4,
        points: 5,
        required: true
    },
    asr: {
        nameKey: 'asr',
        rakaat: 4,
        points: 5,
        required: true
    },
    maghrib: {
        nameKey: 'maghrib',
        rakaat: 3,
        points: 5,
        required: true
    },
    isha: {
        nameKey: 'isha',
        rakaat: 4,
        points: 5,
        required: true
    },
    qiyam: {
        nameKey: 'qiyam',
        rakaat: 0, // Variable
        points: 3,
        required: false
    }
};

// Initialize default data structure
function getDefaultData() {
    return {
        version: DATA_VERSION,
        settings: {
            language: 'ar',
            theme: 'light',
            lastVisit: getCurrentDate(),
            initialized: getTimestamp()
        },
        prayers: {},
        qadaPrayers: [],
        habits: [],
        points: {
            total: 0,
            history: []
        }
    };
}

// Load data from localStorage
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return getDefaultData();
        }

        const data = JSON.parse(stored);

        // Migrate if needed
        if (data.version !== DATA_VERSION) {
            return migrateData(data);
        }

        // Check if new day and reset daily data
        if (data.settings.lastVisit !== getCurrentDate()) {
            handleDailyReset(data);
        }

        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return getDefaultData();
    }
}

// Save data to localStorage
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Handle daily reset
function handleDailyReset(data) {
    // Update habits streaks for sin avoidance
    const currentDate = getCurrentDate();
    data.habits.forEach(habit => {
        if (habit.type === 'sin' && habit.history) {
            const lastDate = Object.keys(habit.history).sort().pop();
            if (lastDate && lastDate !== currentDate) {
                const daysDiff = getDaysDifference(lastDate, currentDate);
                // Award points for consecutive days of avoidance
                if (habit.history[lastDate] === 'avoided') {
                    for (let i = 1; i < daysDiff; i++) {
                        addPointsToData(data, 1, `${t(habit.name)} - ${t('mark_avoided')}`);
                    }
                }
            }
        }
    });

    data.settings.lastVisit = currentDate;
    saveData(data);
}

// Migrate data (for future versions)
function migrateData(oldData) {
    const newData = getDefaultData();
    // Copy over existing data with transformations as needed
    return { ...newData, ...oldData, version: DATA_VERSION };
}

// Get daily prayers for a specific date
function getDailyPrayers(date = getCurrentDate()) {
    const data = loadData();
    if (!data.prayers[date]) {
        data.prayers[date] = {};
        saveData(data);
    }
    return data.prayers[date];
}

// Mark prayer as performed
function markPrayerPerformed(prayerKey, date = getCurrentDate()) {
    const data = loadData();
    const prayer = PRAYERS[prayerKey];

    if (!data.prayers[date]) {
        data.prayers[date] = {};
    }

    // If already marked with the same status, do nothing
    if (data.prayers[date][prayerKey]?.status === 'done') {
        return { success: false, message: t('prayer_done') };
    }

    // If marked with different status, reset first to handle points
    if (data.prayers[date][prayerKey]?.status) {
        resetPrayerStatus(prayerKey, date);
        return markPrayerPerformed(prayerKey, date); // Recursive call after reset
    }

    data.prayers[date][prayerKey] = {
        status: 'done',
        timestamp: getTimestamp()
    };

    // Add points
    addPointsToData(data, prayer.points, `${t(prayer.nameKey)} - ${t('performed')}`);

    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        SyncManager.pushPrayerRecord(date, prayerKey, 'done');
    }

    return { success: true, data };
}

// Mark prayer as missed
function markPrayerMissed(prayerKey, date = getCurrentDate()) {
    const data = loadData();
    const prayer = PRAYERS[prayerKey];

    if (!data.prayers[date]) {
        data.prayers[date] = {};
    }

    // If already marked with the same status, do nothing
    if (data.prayers[date][prayerKey]?.status === 'missed') {
        return { success: false, message: t('prayer_missed') };
    }

    // If marked with different status, reset first to handle points
    if (data.prayers[date][prayerKey]?.status) {
        resetPrayerStatus(prayerKey, date);
        return markPrayerMissed(prayerKey, date); // Recursive call after reset
    }

    data.prayers[date][prayerKey] = {
        status: 'missed',
        timestamp: getTimestamp()
    };

    // Deduct points
    if (prayer.required) {
        addPointsToData(data, -prayer.points, `${t(prayer.nameKey)} - ${t('missed')}`);

        // Add to qada prayers
        const qadaItem = {
            id: generateId(),
            prayer: prayerKey,
            date: date,
            rakaat: prayer.rakaat,
            timestamp: getTimestamp()
        };
        data.qadaPrayers.push(qadaItem);

        // Sync Qada item to cloud
        if (window.SyncManager) {
            SyncManager.pushQadaRecord(qadaItem);
        }
    }

    saveData(data);

    // Sync Prayer status to cloud
    if (window.SyncManager) {
        SyncManager.pushPrayerRecord(date, prayerKey, 'missed');
    }

    return { success: true, data };
}

// Get qada prayers
function getQadaPrayers() {
    const data = loadData();
    return data.qadaPrayers || [];
}

// Make up a qada prayer
function makeUpQadaPrayer(qadaId) {
    const data = loadData();
    const index = data.qadaPrayers.findIndex(q => q.id === qadaId);

    if (index === -1) {
        return { success: false, message: t('error_invalid_input') };
    }

    // Remove from qada list
    data.qadaPrayers.splice(index, 1);

    // Add points
    addPointsToData(data, 3, t('made_up'));

    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        SyncManager.removeQadaRecord(qadaId);
    }

    return { success: true, data };
}

// Add manual qada prayer (for past missed prayers)
function addManualQadaPrayer(prayerKey, count = 1, date = null) {
    const data = loadData();
    const prayer = PRAYERS[prayerKey];

    if (!prayer || !prayer.required) {
        return { success: false, message: t('error_invalid_input') };
    }

    // Add multiple prayers if count > 1
    for (let i = 0; i < count; i++) {
        const qadaItem = {
            id: generateId(),
            prayer: prayerKey,
            date: date || 'unknown',
            rakaat: prayer.rakaat,
            timestamp: getTimestamp(),
            manual: true
        };
        data.qadaPrayers.push(qadaItem);

        // Sync to cloud
        if (window.SyncManager) {
            SyncManager.pushQadaRecord(qadaItem);
        }
    }

    saveData(data);
    return { success: true, data, count };
}


// Get all habits
function getHabits() {
    const data = loadData();
    return data.habits || [];
}

// Add habit
function addHabit(name, type) {
    const data = loadData();
    const habit = {
        id: generateId(),
        name: name,
        type: type, // 'worship' or 'sin'
        history: {},
        created: getTimestamp()
    };

    data.habits.push(habit);
    saveData(data);
    return { success: true, habit, data };
}

// Mark habit for today
function markHabit(habitId, action, date = getCurrentDate()) {
    const data = loadData();
    const habit = data.habits.find(h => h.id === habitId);

    if (!habit) {
        return { success: false, message: t('error_invalid_input') };
    }

    if (!habit.history) {
        habit.history = {};
    }

    if (habit.history[date] === action) {
        return { success: false, message: t('habit_marked_message') };
    }

    // Reset if already marked with different action
    if (habit.history[date]) {
        resetHabitStatus(habitId, date);
        return markHabit(habitId, action, date);
    }

    habit.history[date] = action;

    // Calculate points based on type and action
    if (habit.type === 'worship' && action === 'done') {
        addPointsToData(data, 1, habit.name);
    } else if (habit.type === 'sin') {
        if (action === 'committed') {
            addPointsToData(data, -10, `${habit.name} - ${t('mark_committed')}`);
        } else if (action === 'avoided') {
            addPointsToData(data, 1, `${habit.name} - ${t('mark_avoided')}`);
        }
    }

    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        if (habit.history[date]) {
            SyncManager.pushHabitAction(habitId, date, habit.history[date]);
        } else {
            // Logic not reachable here given lines 318-320 check, but safe to assume add
        }
    }
    return { success: true, data };
}

// Delete habit
function deleteHabit(habitId) {
    const data = loadData();
    const index = data.habits.findIndex(h => h.id === habitId);

    if (index === -1) {
        return { success: false, message: t('error_invalid_input') };
    }

    data.habits.splice(index, 1);
    saveData(data);
    return { success: true, data };
}

// Helper: Add points
function addPointsToData(data, amount, reason) {
    data.points.total += amount;
    data.points.history.push({
        amount: amount,
        reason: reason,
        timestamp: getTimestamp()
    });

    // Sync to cloud
    if (window.SyncManager) {
        SyncManager.pushPoint(amount, reason);
    }
}

// Get points
function getPoints() {
    const data = loadData();
    return data.points;
}

// Get statistics
function getStatistics() {
    const data = loadData();

    let prayersPerformed = 0;
    let prayersMissed = 0;
    let totalRakaat = 0;

    // Count prayers
    Object.values(data.prayers).forEach(dayPrayers => {
        Object.entries(dayPrayers).forEach(([prayerKey, prayerData]) => {
            if (prayerData.status === 'done') {
                prayersPerformed++;
                totalRakaat += PRAYERS[prayerKey].rakaat;
            } else if (prayerData.status === 'missed') {
                prayersMissed++;
            }
        });
    });

    // Count worship habits
    let worshipCount = 0;
    data.habits.forEach(habit => {
        if (habit.type === 'worship' && habit.history) {
            worshipCount += Object.values(habit.history).filter(v => v === 'done').length;
        }
    });

    // Count days without sins
    let daysWithoutSin = 0;
    const sinHabits = data.habits.filter(h => h.type === 'sin');
    if (sinHabits.length > 0) {
        // Get last 30 days
        const dates = getMonthDates();
        dates.forEach(date => {
            const hasCommittedSin = sinHabits.some(habit =>
                habit.history && habit.history[date] === 'committed'
            );
            if (!hasCommittedSin) {
                daysWithoutSin++;
            }
        });
    }

    return {
        prayersPerformed,
        prayersMissed,
        totalRakaat,
        worshipCount,
        daysWithoutSin,
        totalPoints: data.points.total
    };
}

// Export data
function exportData() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salatk-backup-${getCurrentDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import data
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                saveData(data);

                // Sync to cloud
                if (window.SyncManager) {
                    SyncManager.pushSettings(data.settings);
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Clear all data
function clearAllData() {
    const data = getDefaultData();
    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        const newHabit = data.habits[data.habits.length - 1];
        SyncManager.pushHabit(newHabit);
    }
    return data;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get habit streak
function getHabitStreak(habitId) {
    const data = loadData();
    const habit = data.habits.find(h => h.id === habitId);

    if (!habit || !habit.history) {
        return 0;
    }

    const dates = Object.keys(habit.history).sort().reverse();
    let streak = 0;
    const today = getCurrentDate();

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = formatDate(expectedDate);

        if (date !== expectedDateStr) {
            break;
        }

        const action = habit.history[date];
        if ((habit.type === 'worship' && action === 'done') ||
            (habit.type === 'sin' && action === 'avoided')) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Reset prayer status (Undo)
function resetPrayerStatus(prayerKey, date = getCurrentDate()) {
    const data = loadData();
    const prayer = PRAYERS[prayerKey];
    const currentStatus = data.prayers[date]?.[prayerKey]?.status;

    if (!currentStatus) {
        return { success: false, message: t('error_invalid_input') };
    }

    // Reverse points
    if (currentStatus === 'done') {
        addPointsToData(data, -prayer.points, `${t(prayer.nameKey)} - ${t('reset_decision')}`);
    } else if (currentStatus === 'missed' && prayer.required) {
        addPointsToData(data, prayer.points, `${t(prayer.nameKey)} - ${t('reset_decision')}`);

        // Remove from qada prayers
        const qadaIndex = data.qadaPrayers.findIndex(q => q.prayer === prayerKey && q.date === date);
        if (qadaIndex !== -1) {
            data.qadaPrayers.splice(qadaIndex, 1);
        }
    }

    delete data.prayers[date][prayerKey];

    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        SyncManager.deletePrayerRecord(date, prayerKey);
    }

    return { success: true, data };
}

// Reset habit status (Undo)
function resetHabitStatus(habitId, date = getCurrentDate()) {
    const data = loadData();
    const habit = data.habits.find(h => h.id === habitId);

    if (!habit || !habit.history || !habit.history[date]) {
        return { success: false, message: t('error_invalid_input') };
    }

    const currentAction = habit.history[date];

    // Reverse points
    if (habit.type === 'worship' && currentAction === 'done') {
        addPointsToData(data, -1, `${habit.name} - ${t('reset_decision')}`);
    } else if (habit.type === 'sin') {
        if (currentAction === 'committed') {
            addPointsToData(data, 10, `${habit.name} - ${t('reset_decision')}`);
        } else if (currentAction === 'avoided') {
            addPointsToData(data, -1, `${habit.name} - ${t('reset_decision')}`);
        }
    }

    delete habit.history[date];

    saveData(data);

    // Sync to cloud
    if (window.SyncManager) {
        SyncManager.removeHabitAction(habitId, date);
    }

    return { success: true, data };
}
