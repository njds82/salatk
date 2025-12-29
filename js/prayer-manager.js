// ========================================
// Prayer Manager - Local Calculation (Adhan.js)
// ========================================

const PRAYER_CACHE_KEY = 'salatk_prayer_location'; // Only caching location now, times are calc'd live

const PrayerManager = {
    // Initialize
    async init() {
        console.log('Initializing Prayer Manager (Manual/Default Only)...');
        this.startMissedPrayersCheck();
        return this.getPrayerTimesForToday();
    },

    // Get user location (Manual or Default only)
    async getUserLocation() {
        const PRAYER_CACHE_KEY = 'salatk_prayer_location';

        // 1. Try to get cached/manual location
        const cached = localStorage.getItem(PRAYER_CACHE_KEY);
        if (cached) {
            const cachedData = JSON.parse(cached);
            return cachedData;
        }

        // 2. Default to Jerusalem if nothing set
        console.log('No location set, defaulting to Jerusalem');
        const defaultLoc = {
            lat: 31.7683,
            long: 35.2137,
            name: 'Jerusalem', // for UI display if needed
            manualMode: true
        };
        localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(defaultLoc));
        return defaultLoc;
    },

    // Save manual location
    saveManualLocation(lat, long, name = '') {
        const loc = {
            lat: parseFloat(lat),
            long: parseFloat(long),
            name: name,
            lastUpdate: Date.now(),
            manualMode: true
        };
        localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(loc));
        return loc;
    },

    // Clear manual location (Resets to default)
    clearManualLocation() {
        localStorage.removeItem(PRAYER_CACHE_KEY);
    },

    // Calculate prayer times using Adhan.js
    async calculatePrayerTimes(lat, long) {
        if (!window.adhan) {
            console.error('Adhan.js library not loaded!');
            return null;
        }

        try {
            const coordinates = new adhan.Coordinates(lat, long);
            const date = new Date();

            // Get settings
            let methodStr = 'UmmAlQura';
            let madhabStr = 'Shafi';

            // Try to get from SettingsService if available, otherwise fallback or sync
            if (window.SettingsService) {
                // If this is called in loop, might be expensive to query indexedDB every time?
                // But SettingsService.get is async. 
                // We should cache this or make calculatePrayerTimes async.
                // It IS accessed async in getPrayerTimesForToday, so we are good to await.
                methodStr = await SettingsService.get('calculationMethod', 'UmmAlQura');
                madhabStr = await SettingsService.get('madhab', 'Shafi');
            }

            // Map string to Adhan constant
            let params;
            switch (methodStr) {
                case 'MuslimWorldLeague': params = adhan.CalculationMethod.MuslimWorldLeague(); break;
                case 'Egyptian': params = adhan.CalculationMethod.Egyptian(); break;
                case 'Karachi': params = adhan.CalculationMethod.Karachi(); break;
                case 'UmmAlQura': params = adhan.CalculationMethod.UmmAlQura(); break;
                case 'Dubai': params = adhan.CalculationMethod.Dubai(); break;
                case 'Kuwait': params = adhan.CalculationMethod.Kuwait(); break;
                case 'Qatar': params = adhan.CalculationMethod.Qatar(); break;
                case 'Singapore': params = adhan.CalculationMethod.Singapore(); break;
                case 'NorthAmerica': params = adhan.CalculationMethod.NorthAmerica(); break;
                case 'Other': params = adhan.CalculationMethod.Other(); break;
                default: params = adhan.CalculationMethod.UmmAlQura();
            }

            if (madhabStr === 'Hanafi') {
                params.madhab = adhan.Madhab.Hanafi;
            } else {
                params.madhab = adhan.Madhab.Shafi;
            }

            const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

            // Adhan returns Date objects. We format them to HH:MM using existing utils
            // If formatTime is not global, we use local helper, but previous file assumed global/utils.
            // verifying formatTime usage in old file: "formatTime(now)" line 143. It is global.

            return {
                fajr: formatTime(prayerTimes.fajr),
                duha: formatTime(prayerTimes.sunrise),
                dhuhr: formatTime(prayerTimes.dhuhr),
                asr: formatTime(prayerTimes.asr),
                maghrib: formatTime(prayerTimes.maghrib),
                isha: formatTime(prayerTimes.isha)
            };
        } catch (error) {
            console.error('Error calculating prayer times:', error);
            if (window.showToast) {
                showToast(t('error_calculation'), 'error');
            }
            return null;
        }
    },

    // Get times for today
    async getPrayerTimesForToday() {
        // Needs location
        const location = await this.getUserLocation();
        return await this.calculatePrayerTimes(location.lat, location.long);
    },

    // Check for missed prayers
    async checkAndMarkMissedPrayers() {
        const times = await this.getPrayerTimesForToday();
        if (!times) return;

        const now = new Date();
        const currentTimeStr = formatTime(now); // HH:MM from date-utils

        // Helper to convert time "HH:MM" to minutes for comparison
        const timeToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const currentMinutes = timeToMinutes(currentTimeStr);

        // Define windows (Start -> End)
        const schedule = [
            { key: 'fajr', start: times.fajr, end: times.duha },
            { key: 'duha', start: times.duha, end: times.dhuhr },
            { key: 'dhuhr', start: times.dhuhr, end: times.asr },
            { key: 'asr', start: times.asr, end: times.maghrib },
            { key: 'maghrib', start: times.maghrib, end: times.isha },
            { key: 'isha', start: times.isha, end: '23:59' }
        ];

        schedule.forEach(slot => {
            const startMinutes = timeToMinutes(slot.start);
            const endMinutes = timeToMinutes(slot.end);

            // If current time is PAST the end time
            if (currentMinutes > endMinutes) {
                // Check if not performed yet
                const dailyPrayers = getDailyPrayers(getCurrentDate()); // from data-manager
                if (!dailyPrayers[slot.key]?.status) {
                    // Not done and not already missed
                    console.log(`Auto-marking missed: ${slot.key}`);
                    markPrayerMissed(slot.key);
                }
            }
        });
    },

    // Start periodic check
    startMissedPrayersCheck() {
        // Check immediately
        this.checkAndMarkMissedPrayers();

        // Then every minute
        setInterval(() => {
            this.checkAndMarkMissedPrayers();
        }, 60000);
    }
};

// Expose globally
window.PrayerManager = PrayerManager;
