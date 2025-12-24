// ========================================
// Prayer Manager - Local Calculation (Adhan.js)
// ========================================

// Get user-specific cache key
const getPrayerCacheKey = () => {
    return AuthManager.getUserKey('salatk_prayer_location');
};

const PrayerManager = {
    // Initialize
    async init() {
        console.log('Initializing Prayer Manager (Adhan.js)...');

        // Check permissions and get location if needed
        // Then loop to check for missed prayers
        this.startMissedPrayersCheck();

        return this.getPrayerTimesForToday();
    },

    // Get user location
    getUserLocation() {
        return new Promise((resolve) => {
            const now = Date.now();
            const FIVE_HOURS = 5 * 60 * 60 * 1000;

            // 1. Check if manual mode is on
            const cached = localStorage.getItem(getPrayerCacheKey());
            let cachedData = null;
            if (cached) {
                cachedData = JSON.parse(cached);
                if (cachedData.manualMode) {
                    console.log('Using manual location mode:', cachedData);
                    resolve(cachedData);
                    return;
                }
            }

            // Function to perform background GPS update
            const updateLocationInBackground = () => {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 4000,
                    maximumAge: 3600000
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const loc = {
                            lat: position.coords.latitude,
                            long: position.coords.longitude,
                            lastUpdate: Date.now(),
                            manualMode: false
                        };
                        localStorage.setItem(getPrayerCacheKey(), JSON.stringify(loc));
                        console.log('Background location update successful:', loc);
                    },
                    (error) => {
                        console.warn('Background location update failed:', error.message);
                    },
                    options
                );
            };

            // 2. If we have a cached location
            if (cachedData && cachedData.lat && cachedData.long) {
                const lastUpdate = cachedData.lastUpdate || 0;

                // If it's been more than 5 hours, trigger background update
                if (now - lastUpdate > FIVE_HOURS) {
                    console.log('Location stale (>5h), updating in background...');
                    updateLocationInBackground();
                }

                resolve(cachedData);
                return;
            }

            // 3. No cache (First run): blocking GPS request
            if (!navigator.geolocation) {
                console.warn('Geolocation not supported, using default');
                resolve({ lat: 21.3891, long: 39.8579, manualMode: false });
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 4000,
                maximumAge: 3600000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        long: position.coords.longitude,
                        lastUpdate: Date.now(),
                        manualMode: false
                    };
                    localStorage.setItem(getPrayerCacheKey(), JSON.stringify(loc));
                    resolve(loc);
                },
                (error) => {
                    console.warn(`Initial geolocation error: ${error.message}`);
                    if (window.showToast) {
                        showToast(`${t('error_location')}. Using default (Mecca).`, 'warning');
                    }
                    resolve({ lat: 21.3891, long: 39.8579, manualMode: false });
                },
                options
            );
        });
    },

    // Save manual location
    saveManualLocation(lat, long) {
        const loc = {
            lat: parseFloat(lat),
            long: parseFloat(long),
            lastUpdate: Date.now(),
            manualMode: true
        };
        localStorage.setItem(getPrayerCacheKey(), JSON.stringify(loc));
        return loc;
    },

    // Clear manual location and use auto-detect
    clearManualLocation() {
        localStorage.removeItem(getPrayerCacheKey());
    },

    // Calculate prayer times using Adhan.js
    calculatePrayerTimes(lat, long) {
        if (!window.adhan) {
            console.error('Adhan.js library not loaded!');
            return null;
        }

        try {
            const coordinates = new adhan.Coordinates(lat, long);
            const date = new Date();
            const params = adhan.CalculationMethod.UmmAlQura();
            params.madhab = adhan.Madhab.Shafi;

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
                showToast('Error calculating prayer times.', 'error');
            }
            return null;
        }
    },

    // Get times for today
    async getPrayerTimesForToday() {
        // Needs location
        const location = await this.getUserLocation();
        return this.calculatePrayerTimes(location.lat, location.long);
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
