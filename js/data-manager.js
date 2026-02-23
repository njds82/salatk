// ========================================
// Data Manager (Legacy Facade -> New Services)
// ========================================
// This file is kept to avoid breaking imports but now redirects to new Async Services.
// WARNING: Most methods are now ASYNC. Old synchronous calls will fail or return Promises.

// Re-export PRAYERS for compatibility if needed, though PrayerService has it.
const PRAYERS_LEGACY = {
    fajr: { nameKey: 'fajr', rakaat: 2, points: 5, required: true },
    dhuhr: { nameKey: 'dhuhr', rakaat: 4, points: 5, required: true },
    asr: { nameKey: 'asr', rakaat: 4, points: 5, required: true },
    maghrib: { nameKey: 'maghrib', rakaat: 3, points: 5, required: true },
    isha: { nameKey: 'isha', rakaat: 4, points: 5, required: true }
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

async function markPrayerMissed(prayerKey, date) {
    return await PrayerService.markPrayer(prayerKey, date, 'missed');
}

async function getQadaPrayers() {
    return await PrayerService.getQadaPrayers();
}

async function deleteHabit(habitId) {
    return await HabitService.delete(habitId);
}

// Statistics Helper
async function getStatistics() {
    if (!window.supabaseClient) return { prayersPerformed: 0, prayersMissed: 0, totalRakaat: 0, worshipCount: 0, daysWithoutSin: 0, totalPoints: 0 };

    const session = await window.AuthManager.getSession();
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

    // Dispatch update for header if available
    if (window.updatePointsDisplay) {
        // Don't await, just trigger sync
        updatePointsDisplay();
    }

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
