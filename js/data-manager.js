// ========================================
// Data Manager (Legacy Facade -> New Services)
// ========================================
// This file is kept to avoid breaking imports but now redirects to new Async Services.
// WARNING: Most methods are now ASYNC. Old synchronous calls will fail or return Promises.

const STORAGE_KEY = 'salatk_data';
const DATA_VERSION = '1.3.0';

// Re-export PRAYERS for compatibility if needed, though PrayerService has it.
const PRAYERS_LEGACY = {
    fajr: { nameKey: 'fajr', rakaat: 2, points: 5, required: true },
    duha: { nameKey: 'duha', rakaat: 2, points: 3, required: false },
    dhuhr: { nameKey: 'dhuhr', rakaat: 4, points: 5, required: true },
    asr: { nameKey: 'asr', rakaat: 4, points: 5, required: true },
    maghrib: { nameKey: 'maghrib', rakaat: 3, points: 5, required: true },
    isha: { nameKey: 'isha', rakaat: 4, points: 5, required: true },
    qiyam: { nameKey: 'qiyam', rakaat: 0, points: 3, required: false }
};

// Deprecated: loadData
function loadData() {
    console.warn('loadData() is deprecated. Use Services instead.');
    return { settings: {}, prayers: {}, qadaPrayers: [], habits: [], points: {} };
}

// Deprecated: saveData
function saveData(data) {
    console.warn('saveData() is deprecated. Data is auto-saved to DB.');
}

// Bridge Methods (Now Async)
async function getDailyPrayers(date) {
    return await PrayerService.getDailyPrayers(date);
}

async function markPrayerPerformed(prayerKey, date) {
    return await PrayerService.markPrayer(prayerKey, date, 'done');
}

async function markPrayerMissed(prayerKey, date) {
    return await PrayerService.markPrayer(prayerKey, date, 'missed');
}

async function getQadaPrayers() {
    return await db.qada.toArray();
}

async function makeUpQadaPrayer(qadaId) {
    const qada = await db.qada.get(qadaId);
    if (!qada) return { success: false };

    await db.qada.delete(qadaId);
    await PointsService.addPoints(3, t('made_up'));

    if (window.SyncManager) SyncManager.removeQadaRecord(qadaId);
    return { success: true };
}

async function addManualQadaPrayer(prayerKey, count = 1, date = null) {
    // Basic implementation for bridge
    for (let i = 0; i < count; i++) {
        const item = {
            id: crypto.randomUUID(),
            prayer: prayerKey,
            date: date || 'unknown',
            rakaat: PRAYERS_LEGACY[prayerKey].rakaat,
            timestamp: Date.now(),
            manual: true
        };
        await db.qada.add(item);
        if (window.SyncManager) SyncManager.pushQadaRecord(item);
    }
    return { success: true };
}

async function getHabits() {
    return await HabitService.getAll();
}

async function addHabit(name, type) {
    return await HabitService.add(name, type);
}

async function deleteHabit(habitId) {
    return await HabitService.delete(habitId);
}

async function markHabit(habitId, action, date) {
    return await HabitService.logAction(habitId, date, action);
}

// Helpers
function generateId() {
    return crypto.randomUUID();
}

async function clearAllData() {
    await db.delete();
    await db.open();
    return true;
}

// Export / Import (Needs rewrite for Async, keeping placeholders)
async function exportData() {
    // Reconstruct full JSON from DB
    const data = {
        version: DATA_VERSION,
        settings: await SettingsService.getSettings(),
        prayers: {}, // Need to fetch all? Expensive.
        qadaPrayers: await db.qada.toArray(),
        habits: await HabitService.getAll(),
        points: { history: await db.points.toArray() }
    };
    // Fetch all prayers... 
    const allPrayers = await db.prayers.toArray();
    allPrayers.forEach(p => {
        if (!data.prayers[p.date]) data.prayers[p.date] = {};
        data.prayers[p.date][p.key] = { status: p.status, timestamp: p.timestamp };
    });

    // Download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salatk-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Statistics Helper
async function getStatistics() {
    const prayers = await db.prayers.toArray();
    const habits = await HabitService.getAll();
    const habitHistory = await db.habit_history.toArray();
    const points = await PointsService.getTotalPoints();

    let prayersPerformed = 0;
    let prayersMissed = 0;
    let totalRakaat = 0;

    prayers.forEach(p => {
        if (p.status === 'done') {
            prayersPerformed++;
            totalRakaat += (PRAYERS_LEGACY[p.key]?.rakaat || 0);
        } else if (p.status === 'missed') {
            prayersMissed++;
        }
    });

    let worshipCount = 0;
    habitHistory.forEach(h => {
        // Need to check habit type if possible, or assume all 'done' actions are worship?
        // Simple heuristic: if action is 'done' it's worship.
        if (h.action === 'done') worshipCount++;
    });

    // Days without sin calculation (simplified)
    // We need dates where NO sin was committed? 
    // Or dates where Sins were marked 'avoided'?
    // Logic from old file: 
    // "Count days where NO sin habit was marked 'committed'" in last 30 days.
    // This requires complex query. For checking, let's just count 'avoided' actions for now as proxy or return 0.
    // Real implementation requires proper time range check.
    // Let's rely on 'avoided' counts for simplicity in this migration phase.
    let daysWithoutSin = habitHistory.filter(h => h.action === 'avoided').length;

    return {
        prayersPerformed,
        prayersMissed,
        totalRakaat,
        worshipCount,
        daysWithoutSin,
        totalPoints: points
    };
}

// Global exposure
window.PRAYERS = PRAYERS_LEGACY;
window.getStatistics = getStatistics;
// window.loadData ... defined above
