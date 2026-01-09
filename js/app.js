// ========================================
// Main App Controller
// ========================================

// App State
window.currentPage = 'daily-prayers';
window.selectedDate = getCurrentDate();

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initial theme/lang load (fast feedback from localStorage)
    const savedTheme = localStorage.getItem('salatk_theme') || 'light';
    const savedLang = localStorage.getItem('salatk_lang') || 'ar';

    if (window.SettingsService) {
        SettingsService.applySettings({ theme: savedTheme, language: savedLang });
    } else {
        // Fallback if service not yet loaded
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Set up event listeners
    setupEventListeners();

    // Initialize data (Async)
    // loadData(); // Deprecated

    // Check for authentication & Initialize
    checkAuthAndInit();

    // Listen for auth state changes to refresh data
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, !!session);

            const oldSession = window.AuthManager ? window.AuthManager._session : null;
            if (window.AuthManager) window.AuthManager.setSession(session);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // If it's a new login or we were previously unauthenticated, refresh UI
                if (!oldSession && session) {
                    await updatePointsDisplay();
                    if (window.PrayerManager) {
                        const times = await PrayerManager.init();
                        if (window.NotificationManager) {
                            NotificationManager.scheduleNextPrayer(times);
                        }
                    }
                    // If we were on login/signup, go to main page
                    if (window.currentPage === 'login' || window.currentPage === 'signup') {
                        navigateTo('daily-prayers');
                    }
                }
            }

            if (event === 'SIGNED_OUT') {
                if (window.currentPage !== 'login' && window.currentPage !== 'signup') {
                    navigateTo('login');
                }
            }
        });
    }

    // Initialize notification badge
    if (window.updateNotifBadge) updateNotifBadge();

    // Initialize Notifications
    if (window.NotificationManager) {
        NotificationManager.init();
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});

const ATHKAR = [
    "سُبْحـانَ اللهِ وَبِحَمْـدِهِ عَدَدَ خَلْـقِه ، وَرِضـا نَفْسِـه ، وَزِنَـةَ عَـرْشِـه ، وَمِـدادَ كَلِمـاتِـه",
    "اللّهُـمَّ إِنِّـي أَسْأَلُـكَ عِلْمـاً نافِعـاً ، وَرِزْقـاً طَيِّبـاً ، وَعَمَـلاً مُتَقَبَّـلاً",
    "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ",
    "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ"
];

function showRandomQuote() {
    const quoteEl = document.getElementById('splashQuote');
    if (quoteEl) {
        const randomQuote = ATHKAR[Math.floor(Math.random() * ATHKAR.length)];
        quoteEl.textContent = randomQuote;
    }
}

async function checkAuthAndInit() {
    // Show random quote on splash
    showRandomQuote();

    const splashScreen = document.getElementById('splashScreen');

    // Start initializations in parallel
    const initTasks = [];
    if (window.SettingsService) {
        initTasks.push(SettingsService.init());
    }

    // CRITICAL: We MUST wait for prayer times before main render to avoid stale data
    // This solves the race condition where UI loads with empty data then snaps
    let prayerTimesPromise = null;
    if (window.PrayerManager) {
        prayerTimesPromise = PrayerManager.init();
        initTasks.push(prayerTimesPromise);
    }

    // Wait for essential services
    // We add a minimum delay to let users read the Athkar (at least 1.5s total)
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

    try {
        await Promise.all([...initTasks, minDelay]);

        // Schedule next prayer notification if we have times
        if (prayerTimesPromise && window.NotificationManager) {
            const times = await prayerTimesPromise;
            NotificationManager.scheduleNextPrayer(times);
        }
    } catch (e) {
        console.error("Initialization error:", e);
    }

    // Determine target page
    navigateToHash();

    // Update points display after potential sync
    updatePointsDisplay();

    // Hide Splash Screen
    if (splashScreen) {
        splashScreen.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }

    // BACKGROUND TASKS: Non-critical cleanup and sync
    setTimeout(async () => {
        // Cleanup Qada records in cloud
        if (window.PrayerService && window.PrayerService.cleanupQada) {
            await PrayerService.cleanupQada();
        }

        // Sync data if configured (Now Cloud-Only)
        if (window.SyncManager) {
            SyncManager.subscribeToChanges();
        }
    }, 100);
}


// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            if (window.handleThemeChange) {
                handleThemeChange(newTheme);
            } else {
                // Fallback for app.js internal toggle if pages/settings.js not active
                document.documentElement.setAttribute('data-theme', newTheme);
                if (window.SettingsService) SettingsService.set('theme', newTheme);
            }
        });
    }

    // Language toggle
    const langToggle = document.getElementById('langToggle');
    langToggle.addEventListener('click', () => {
        const currentLang = getCurrentLanguage();
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        navigateTo(currentPage);
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Notification Center
    const notifToggle = document.getElementById('notifToggle');
    if (notifToggle) {
        notifToggle.addEventListener('click', () => {
            toggleNotifCenter();
        });
    }

    const closeNotif = document.getElementById('closeNotif');
    if (closeNotif) {
        closeNotif.addEventListener('click', () => {
            toggleNotifCenter();
        });
    }

    const clearNotifs = document.getElementById('clearNotifs');
    if (clearNotifs) {
        clearNotifs.addEventListener('click', () => {
            clearAllNotifications();
        });
    }

    // Hash change
    window.addEventListener('hashchange', navigateToHash);

    // Language changed event
    window.addEventListener('languageChanged', (e) => {
        // Only re-render if we are NOT currently rendering another page or if triggered externally
        // But since LangToggle handles navigation, we can just let it be or bail if same lang.
        console.log('Language changed to:', e.detail.language);
    });
}

// Set global selected date
function setSelectedDate(date) {
    selectedDate = date;
    renderPage(currentPage);
}

// Navigate to page
function navigateTo(page) {
    currentPage = page;

    // Update URL hash
    window.location.hash = page;

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Render page
    renderPage(page);
}

/**
 * Handles navigation based on the current URL hash.
 */
function navigateToHash() {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const targetPage = hash || 'daily-prayers';

    // Check if the current page in state is different from the hash
    if (targetPage !== window.currentPage) {
        navigateTo(targetPage);
    }
}

// Helper to wrap a promise with a timeout
async function withTimeout(promise, timeoutMs, timeoutValue = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
    ]);
}

// Render page
async function renderPage(page, noScroll = false) {
    const content = document.getElementById('pageContent');
    const isRefreshing = window.currentPage === page;

    // Only show loading spinner if we are navigating to a NEW page or if we want a full reload
    if (!noScroll || !isRefreshing) {
        content.innerHTML = `<div class="loading-spinner"></div>`;
    }

    let html = '';

    try {
        // Auth check - prioritize cached session
        if (window.AuthManager) {
            // For login/signup, use memory/snapshot synchronously to avoid blocking UI
            if (page === 'login' || page === 'signup') {
                session = window.AuthManager._session;
                window.AuthManager.getSession(); // Background refresh
            } else {
                // For other pages, getSession() will return snapshot instantly if available
                session = await window.AuthManager.getSession();
            }
        }

        // Resilient Navigation Logic:
        // 1. Only redirect to login if we EXPLICITLY have no session (null)
        // 2. If session is just potentially stale (returned by timeout logic), we still render.
        // 3. BACKGROUND verification will handle logout if session is truly invalid.
        if (!session && page !== 'login' && page !== 'signup') {
            navigateTo('login');
            return;
        }

        // If we have a session, don't show login/signup
        if (session && (page === 'login' || page === 'signup')) {
            navigateTo('daily-prayers');
            return;
        }

        switch (page) {
            case 'login':
                html = renderAuthPage('login');
                break;
            case 'signup':
                html = renderAuthPage('signup');
                break;
            case 'daily-prayers':
                html = await renderDailyPrayersPage();
                break;
            case 'qada-prayers':
                html = await renderQadaPrayersPage();
                break;
            case 'habits':
                html = await renderHabitsPage();
                break;
            case 'statistics':
                html = await renderStatisticsPage();
                break;
            case 'leaderboard':
                html = await renderLeaderboardPage();
                break;
            case 'store':
                html = await renderStorePage();
                break;
            case 'settings':
                html = await renderSettingsPage();
                break;
            case 'challenge':
                if (window.renderChallengePage) {
                    html = await window.renderChallengePage();
                } else {
                    html = '<div class="error-message">Error loading challenge module</div>';
                }
                break;
            default:
                html = await renderDailyPrayersPage();
        }

        content.innerHTML = html;

        // Setup form listeners if on auth page
        if (page === 'login' || page === 'signup') {
            setupAuthFormListeners(page);
        }

        // Trigger pageRendered event
        window.dispatchEvent(new CustomEvent('pageRendered', { detail: { page } }));
    } catch (error) {
        console.error('Error rendering page:', error);
        content.innerHTML = `<p class="error-message">${t('error_calculation')}</p>`;
    }

    // Scroll to top only if navigating to a different page or forced
    if (!noScroll && window.location.hash.replace('#', '') !== page) {
        window.scrollTo(0, 0);
    }
}
