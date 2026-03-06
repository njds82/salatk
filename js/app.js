// ========================================
// Main App Controller
// ========================================

// App State
window.currentPage = null;
window.selectedDate = getCurrentDate();
const DEFAULT_PAGE = 'daily-prayers';
const VALID_PAGES = new Set([
    'login',
    'signup',
    'daily-prayers',
    'qada-prayers',
    'habits',
    'daily-tasks',
    'time-management',
    'statistics',
    'leaderboard',
    'store',
    'settings',
    'athkar',
    'more',
    'challenge',
    'admin'
]);
const HEAVY_PAGES = new Set(['settings', 'statistics', 'habits', 'store', 'leaderboard', 'admin']);
const MAIN_NAV_PAGES = Object.freeze([
    'daily-prayers',
    'qada-prayers',
    'habits',
    'leaderboard',
    'daily-tasks',
    'time-management',
    'more'
]);
const MAIN_NAV_LOCKED_PAGES = new Set(['daily-prayers', 'more']);
const MAIN_NAV_MORE_PAGES = new Set(['statistics', 'challenge', 'store', 'athkar', 'settings', 'more', 'admin']);
const NAV_PREFS_KEY = 'salatk_nav_preferences_v1';
const NAV_LABEL_KEYS = Object.freeze({
    'daily-prayers': 'nav_daily_prayers',
    'qada-prayers': 'nav_qada_prayers',
    habits: 'nav_habits',
    leaderboard: 'nav_leaderboard',
    'daily-tasks': 'nav_daily_tasks',
    'time-management': 'nav_time_management',
    more: 'nav_more'
});
let renderRequestToken = 0;

function normalizeNavPreferences(rawPrefs) {
    const rawOrder = Array.isArray(rawPrefs?.order) ? rawPrefs.order : [];
    const rawHidden = Array.isArray(rawPrefs?.hidden) ? rawPrefs.hidden : [];

    const seen = new Set();
    const order = [];
    rawOrder.forEach((page) => {
        if (!MAIN_NAV_PAGES.includes(page) || seen.has(page)) return;
        seen.add(page);
        order.push(page);
    });
    MAIN_NAV_PAGES.forEach((page) => {
        if (!seen.has(page)) order.push(page);
    });

    const hiddenSet = new Set();
    rawHidden.forEach((page) => {
        if (!MAIN_NAV_PAGES.includes(page)) return;
        if (MAIN_NAV_LOCKED_PAGES.has(page)) return;
        hiddenSet.add(page);
    });

    return {
        order,
        hidden: [...hiddenSet]
    };
}

function getNavPreferences() {
    try {
        const parsed = JSON.parse(localStorage.getItem(NAV_PREFS_KEY) || '{}');
        return normalizeNavPreferences(parsed);
    } catch (error) {
        return normalizeNavPreferences({});
    }
}

function saveNavPreferences(nextPrefs) {
    const normalized = normalizeNavPreferences(nextPrefs);
    localStorage.setItem(NAV_PREFS_KEY, JSON.stringify(normalized));
    return normalized;
}

function updateNavigationActiveState(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === page || (itemPage === 'more' && MAIN_NAV_MORE_PAGES.has(page))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function applyNavigationPreferences() {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    const prefs = getNavPreferences();
    const hiddenSet = new Set(prefs.hidden);
    const itemsByPage = new Map();
    mainNav.querySelectorAll('.nav-item[data-page]').forEach(item => {
        const page = item.getAttribute('data-page');
        if (page) itemsByPage.set(page, item);
    });

    prefs.order.forEach((page) => {
        const item = itemsByPage.get(page);
        if (item) {
            mainNav.appendChild(item);
        }
    });

    itemsByPage.forEach((item, page) => {
        const isHidden = hiddenSet.has(page);
        item.classList.toggle('nav-item-hidden', isHidden);
        if (isHidden) {
            item.setAttribute('aria-hidden', 'true');
            item.setAttribute('tabindex', '-1');
        } else {
            item.removeAttribute('aria-hidden');
            item.removeAttribute('tabindex');
        }
    });

    updateNavigationActiveState(window.currentPage);
}

function getNavCustomizationState() {
    const prefs = getNavPreferences();
    const hiddenSet = new Set(prefs.hidden);
    return {
        items: prefs.order.map((page, index) => ({
            id: page,
            labelKey: NAV_LABEL_KEYS[page] || page,
            visible: !hiddenSet.has(page),
            locked: MAIN_NAV_LOCKED_PAGES.has(page),
            canMoveUp: index > 0,
            canMoveDown: index < prefs.order.length - 1
        }))
    };
}

function moveNavPage(page, direction) {
    if (!MAIN_NAV_PAGES.includes(page)) return false;
    const prefs = getNavPreferences();
    const fromIndex = prefs.order.indexOf(page);
    const toIndex = fromIndex + Number(direction || 0);

    if (fromIndex < 0 || toIndex < 0 || toIndex >= prefs.order.length) return false;

    [prefs.order[fromIndex], prefs.order[toIndex]] = [prefs.order[toIndex], prefs.order[fromIndex]];
    saveNavPreferences(prefs);
    applyNavigationPreferences();
    return true;
}

function toggleNavPageVisibility(page) {
    if (!MAIN_NAV_PAGES.includes(page) || MAIN_NAV_LOCKED_PAGES.has(page)) return false;
    const prefs = getNavPreferences();
    const hiddenSet = new Set(prefs.hidden);

    if (hiddenSet.has(page)) {
        hiddenSet.delete(page);
    } else {
        hiddenSet.add(page);
    }

    prefs.hidden = [...hiddenSet];
    saveNavPreferences(prefs);
    applyNavigationPreferences();
    return true;
}

function resetNavCustomization() {
    saveNavPreferences({ order: MAIN_NAV_PAGES, hidden: [] });
    applyNavigationPreferences();
}

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

    // Apply navigation order/visibility customizations from previous sessions
    applyNavigationPreferences();

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

                    if (window.PushService) {
                        PushService.initAutoSubscribe();
                        PushService.hydrateFallbackNotifications();
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

    if (window.PushService) {
        PushService.initAutoSubscribe();
        PushService.hydrateFallbackNotifications();
    }

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

        // Daily Tasks background maintenance
        if (window.TaskService) {
            try {
                const today = getCurrentDate();
                await TaskService.rolloverPendingTasks(today);
                await TaskService.cleanupCompletedTasks(30);
            } catch (taskError) {
                console.warn('Task maintenance skipped:', taskError);
            }
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
    setupMobileNavDrawer();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            closeMobileNavDrawer();
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
        // Navigation handler already triggers the page render.
        console.log('Language changed to:', e.detail.language);
    });
}

function closeMobileNavDrawer() {
    const navToggle = document.getElementById('navMenuToggle');
    document.body.classList.remove('mobile-nav-open');
    if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
    }
}

function setupMobileNavDrawer() {
    const navToggle = document.getElementById('navMenuToggle');
    const navBackdrop = document.getElementById('navDrawerBackdrop');
    const navClose = document.getElementById('navDrawerClose');
    const mainNav = document.getElementById('mainNav');

    if (!navToggle || !navBackdrop || !mainNav) return;

    navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = document.body.classList.toggle('mobile-nav-open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navBackdrop.addEventListener('click', () => {
        closeMobileNavDrawer();
    });

    if (navClose) {
        navClose.addEventListener('click', () => {
            closeMobileNavDrawer();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileNavDrawer();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileNavDrawer();
        }
    });
}

// Set global selected date
function setSelectedDate(date) {
    selectedDate = date;
    renderPage(currentPage);
}

// Navigate to page
function navigateTo(page) {
    closeMobileNavDrawer();
    currentPage = page;

    // Update URL hash
    window.location.hash = page;

    // Update navigation active state
    updateNavigationActiveState(page);

    // Render page
    renderPage(page);
}

/**
 * Handles navigation based on the current URL hash.
 */
function navigateToHash() {
    const rawHash = window.location.hash.substring(1); // Remove the '#'
    const targetPage = VALID_PAGES.has(rawHash) ? rawHash : DEFAULT_PAGE;

    // Keep URL hash canonical when it is empty or invalid.
    if (rawHash !== targetPage) {
        navigateTo(targetPage);
        return;
    }

    // Check if the current page in state is different from the hash
    if (targetPage !== window.currentPage) {
        navigateTo(targetPage);
    }
}

window.applyNavigationPreferences = applyNavigationPreferences;
window.getNavCustomizationState = getNavCustomizationState;
window.moveNavPage = moveNavPage;
window.toggleNavPageVisibility = toggleNavPageVisibility;
window.resetNavCustomization = resetNavCustomization;

// Helper to wrap a promise with a timeout
async function withTimeout(promise, timeoutMs, timeoutValue = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
    ]);
}

function getPageCacheContext(page) {
    if (page === 'habits') {
        return { selectedDate: window.selectedDate || getCurrentDate() };
    }
    return {};
}

function getPageSkeleton(page) {
    const cardCount = page === 'leaderboard' ? 6 : 4;
    const cards = Array.from({ length: cardCount }, () => `
        <div class="page-skeleton-card shimmer"></div>
    `).join('');

    return `
        <div class="page-skeleton" data-page="${page}">
            <div class="page-skeleton-header">
                <div class="page-skeleton-title shimmer"></div>
                <div class="page-skeleton-subtitle shimmer"></div>
            </div>
            <div class="page-skeleton-grid">
                ${cards}
            </div>
        </div>
    `;
}

// Render page
async function renderPage(page, noScroll = false, options = { forceFresh: false, preferCache: true }) {
    const content = document.getElementById('pageContent');
    if (!content) return;
    const requestToken = ++renderRequestToken;
    const renderOptions = {
        forceFresh: Boolean(noScroll || options?.forceFresh),
        preferCache: options?.preferCache !== false
    };
    const isHeavyPage = HEAVY_PAGES.has(page);
    const canUseCache = Boolean(window.PageDataCache && isHeavyPage && renderOptions.preferCache && !renderOptions.forceFresh);
    const cacheContext = getPageCacheContext(page);
    const cachedEntry = canUseCache ? window.PageDataCache.get(page, cacheContext) : null;

    if (window.PageDataCache) {
        window.PageDataCache.pruneExpired();
    }

    const commitPage = (nextHtml, detail = {}) => {
        if (requestToken !== renderRequestToken) return false;

        content.innerHTML = nextHtml;

        if (page === 'login' || page === 'signup') {
            setupAuthFormListeners(page);
        }

        window.dispatchEvent(new CustomEvent('pageRendered', {
            detail: {
                page,
                ...detail
            }
        }));
        return true;
    };

    if (cachedEntry) {
        commitPage(cachedEntry.html, { stale: true, fromCache: true });
    } else if (!noScroll) {
        content.innerHTML = isHeavyPage
            ? getPageSkeleton(page)
            : `<div class="loading-spinner"></div>`;
    }

    let html = '';

    try {
        let session = null;

        // Auth check - prioritize cached session
        if (window.AuthManager) {
            // For login/signup, use memory/snapshot synchronously to avoid blocking UI
            if (page === 'login' || page === 'signup') {
                session = window.AuthManager._session || null;
                window.AuthManager.getSession(); // Background refresh
            } else {
                // For other pages, getSession() will return snapshot instantly if available
                session = await window.AuthManager.getSession();
            }
        }

        if (requestToken !== renderRequestToken) return;

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

        if (session && page !== 'login' && page !== 'signup' && window.AuthManager?.getAccountStatus) {
            const accountStatus = await window.AuthManager.getAccountStatus();
            if (accountStatus?.is_blocked) {
                if (window.showToast) {
                    showToast(t('error_account_blocked'), 'error');
                }
                await window.AuthManager.signOut();
                return;
            }
        }

        if (page === 'admin') {
            const isAdmin = window.AuthManager?.isAdmin ? await window.AuthManager.isAdmin() : false;
            if (!isAdmin) {
                if (window.showToast) showToast(t('error_admin_only'), 'error');
                navigateTo(DEFAULT_PAGE);
                return;
            }
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
            case 'daily-tasks':
                html = await renderDailyTasksPage();
                break;
            case 'time-management':
                html = await renderTimeManagementPage();
                break;
            case 'statistics':
                html = await renderStatisticsPage();
                break;
            case 'leaderboard':
                html = await renderLeaderboardPage({ forceRefresh: renderOptions.forceFresh });
                break;
            case 'store':
                html = await renderStorePage();
                break;
            case 'settings':
                html = await renderSettingsPage();
                break;
            case 'athkar':
                html = await renderAthkarPage();
                break;
            case 'more':
                html = await renderMorePage();
                break;
            case 'challenge':
                if (window.renderChallengePage) {
                    html = await window.renderChallengePage();
                } else {
                    html = '<div class="error-message">Error loading challenge module</div>';
                }
                break;
            case 'admin':
                if (window.renderAdminPage) {
                    html = await window.renderAdminPage();
                } else {
                    html = '<div class="error-message">Error loading admin module</div>';
                }
                break;
            default:
                html = await renderDailyPrayersPage();
        }

        if (requestToken !== renderRequestToken) return;

        if (isHeavyPage && window.PageDataCache) {
            window.PageDataCache.set(page, cacheContext, html);
        }

        if (!cachedEntry || cachedEntry.html !== html || renderOptions.forceFresh) {
            commitPage(html, { stale: false, fromCache: false });
        }
    } catch (error) {
        if (requestToken !== renderRequestToken) return;
        console.error('Error rendering page:', error);
        content.innerHTML = `<p class="error-message">${t('error_calculation')}</p>`;
    }

    if (!noScroll) {
        if (!window.__SALATK_TEST__ && typeof window.scrollTo === 'function') {
            window.scrollTo(0, 0);
        }
    }
}
