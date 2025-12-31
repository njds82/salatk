// ========================================
// Data Manager (Legacy Facade -> New Services)
// ========================================
// This file is kept to avoid breaking imports but now redirects to new Async Services.
// WARNING: Most methods are now ASYNC. Old synchronous calls will fail or return Promises.

const STORAGE_KEY = 'salatk_data';
const DATA_VERSION = '3.2.0';

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
    // Use deterministic ID for qada makeup
    await PointsService.addPoints(3, t('made_up'), `qada:${qadaId}`);

    if (window.SyncManager) await SyncManager.removeQadaRecord(qadaId);
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
        if (window.SyncManager) await SyncManager.pushQadaRecord(item);
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
    if (!window.supabaseClient) return { prayersPerformed: 0, prayersMissed: 0, totalRakaat: 0, worshipCount: 0, daysWithoutSin: 0, totalPoints: 0 };

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return { prayersPerformed: 0, prayersMissed: 0, totalRakaat: 0, worshipCount: 0, daysWithoutSin: 0, totalPoints: 0 };

    const userId = session.user.id;

    // Fetch all relevant data from Cloud
    const [prayersRes, habitHistoryRes, points] = await Promise.all([
        window.supabaseClient.from('prayer_records').select('*').eq('user_id', userId),
        window.supabaseClient.from('habit_history').select('*').eq('user_id', userId),
        PointsService.getTotal()
    ]);

    const prayers = prayersRes.data || [];
    const habitHistory = habitHistoryRes.data || [];

    let prayersPerformed = 0;
    let prayersMissed = 0;
    let totalRakaat = 0;

    prayers.forEach(p => {
        if (p.status === 'done') {
            prayersPerformed++;
            totalRakaat += (PRAYERS_LEGACY[p.prayer_key]?.rakaat || 0);
        } else if (p.status === 'missed') {
            prayersMissed++;
        }
    });

    let worshipCount = 0;
    habitHistory.forEach(h => {
        if (h.action === 'done') worshipCount++;
    });

    let daysWithoutSin = habitHistory.filter(h => h.action === 'avoided').length;

    return {
        prayersPerformed,
        prayersMissed,
        totalRakaat,
        worshipCount,
        daysWithoutSin,
        totalPoints: points,
        rawPrayers: prayers // Helpful for charts
    };
}

// Global exposure
window.PRAYERS = PRAYERS_LEGACY;
window.getStatistics = getStatistics;
// window.loadData ... defined above
