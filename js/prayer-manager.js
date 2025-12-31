// ========================================
// Prayer Manager - Local Calculation (Adhan.js)
// ========================================

const PRAYER_CACHE_KEY = 'salatk_prayer_location'; // Only caching location now, times are calc'd live

const PrayerManager = {
    // Cache for calculated times
    cachedTimes: null,
    cachedDate: null,

    // Initialize
    async init() {
        console.log('Initializing Prayer Manager...');
        this.isChecking = false;

        // Initial calculation to populate cache
        this.cachedTimes = await this.getPrayerTimesForToday();
        this.cachedDate = getCurrentDate();

        await this.startMissedPrayersCheck();
        return this.cachedTimes;
    },

    // Get user location (Manual or Default only)
    async getUserLocation() {
        if (!window.supabaseClient) return this.getDefaultLocation();

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return this.getDefaultLocation();

        try {
            const { data, error } = await window.supabaseClient
                .from('locations')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (data) {
                return {
                    lat: data.latitude,
                    long: data.longitude,
                    name: data.name || '',
                    manualMode: data.is_manual_mode,
                    lastUpdate: new Date(data.last_update).getTime()
                };
            }

            // Migration check: If no cloud data, check legacy localStorage
            const cached = localStorage.getItem(PRAYER_CACHE_KEY);
            if (cached) {
                const legacy = JSON.parse(cached);
                console.log('PrayerManager: Migrating legacy location to cloud...');
                await this.saveManualLocation(legacy.lat, legacy.long, legacy.name || '');
                return legacy;
            }
        } catch (e) {
            console.error('PrayerManager: Failed to fetch cloud location', e);
        }

        return this.getDefaultLocation();
    },

    getDefaultLocation() {
        return {
            lat: 31.7683,
            long: 35.2137,
            name: 'Jerusalem',
            manualMode: true
        };
    },

    async saveManualLocation(lat, long, name = '') {
        const loc = {
            lat: parseFloat(lat),
            long: parseFloat(long),
            name: name,
            lastUpdate: Date.now(),
            manualMode: true
        };

        if (window.supabaseClient) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                try {
                    await window.supabaseClient.from('locations').upsert({
                        user_id: session.user.id,
                        latitude: loc.lat,
                        longitude: loc.long,
                        name: loc.name,
                        is_manual_mode: loc.manualMode,
                        last_update: new Date(loc.lastUpdate).toISOString()
                    });
                } catch (e) {
                    console.error('PrayerManager: Failed to save location to cloud', e);
                }
            }
        }

        // Keep in localStorage as backup for unauthenticated state or immediate access
        localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(loc));
        this.clearCache(); // Force recalculation with new location
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

    // Clear internal cache
    clearCache() {
        this.cachedTimes = null;
        this.cachedDate = null;
    },

    // Get times for today
    async getPrayerTimesForToday() {
        const today = getCurrentDate();
        if (this.cachedTimes && this.cachedDate === today) {
            return this.cachedTimes;
        }

        // Needs location
        const location = await this.getUserLocation();
        this.cachedTimes = await this.calculatePrayerTimes(location.lat, location.long);
        this.cachedDate = today;
        return this.cachedTimes;
    },

    // Check for missed prayers
    async checkAndMarkMissedPrayers() {
        if (this.isChecking) return;
        this.isChecking = true;

        try {
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

            const today = getCurrentDate();
            const dailyPrayers = await getDailyPrayers(today);

            for (const slot of schedule) {
                const startMinutes = timeToMinutes(slot.start);
                const endMinutes = timeToMinutes(slot.end);

                // If current time is PAST the end time
                if (currentMinutes > endMinutes) {
                    // Check if not performed yet
                    if (!dailyPrayers[slot.key]?.status) {
                        // Not done and not already missed
                        console.log(`Auto-marking missed: ${slot.key}`);
                        await markPrayerMissed(slot.key, today);
                    }
                }
            }
        } catch (error) {
            console.error('PrayerManager: Check failed', error);
        } finally {
            this.isChecking = false;
        }
    },

    // Start periodic check
    startMissedPrayersCheck() {
        // Check immediately
        this.checkAndMarkMissedPrayers();

        // Then every minute
        setInterval(async () => {
            await this.checkAndMarkMissedPrayers();
        }, 60000);
    }
};

// Expose globally
window.PrayerManager = PrayerManager;
