// ========================================
// Main App Controller
// ========================================

// App State
window.currentPage = 'daily-prayers';
window.selectedDate = getCurrentDate();

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('salatk_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Update theme icon
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (savedTheme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    // Set up event listeners
    setupEventListeners();

    // Initialize data (Async)
    // loadData(); // Deprecated

    // Check for authentication & Initialize
    checkAuthAndInit();

    // Initialize notification badge
    if (window.updateNotifBadge) updateNotifBadge();
});

async function checkAuthAndInit() {

    // Initialize prayer manager
    if (window.PrayerManager) {
        await PrayerManager.init();
    }

    // Run Migration (LocalStorage -> IndexedDB)
    if (window.MigrationService) {
        await MigrationService.checkAndMigrate();
    }

    if (window.PointsService && window.PointsService.deduplicatePoints) {
        await PointsService.deduplicatePoints();
    }

    // NEW: Clean up ghost Qada records
    if (window.PrayerService && window.PrayerService.cleanupQada) {
        await PrayerService.cleanupQada();
    }

    // Sync data if configured
    if (window.SyncManager) {
        // 1. Pull latest from cloud
        await SyncManager.pullAllData();

        // 2. Push any local data that might be missing in cloud (Recovery/Migration)
        // This ensures data created offline or before login is safe.
        // Note: In case of conflict, SyncManager typically favors Cloud or Merges.
        // For 'pushAllLocalData', it uses upsert, so local values might overwrite cloud if newer.
        await SyncManager.pushAllLocalData();

        // 3. Enable Realtime Sync
        SyncManager.subscribeToChanges();

        // Reload in-memory structures if needed is handled effectively by the services reading from DB
    }

    // Update points display after potential sync
    await updatePointsDisplay();

    // Navigate to initial page
    navigateToHash();
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        handleThemeChange(newTheme);
    });

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

// Navigate based on hash
function navigateToHash() {
    const hash = window.location.hash.replace('#', '') || 'daily-prayers';
    navigateTo(hash);
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
        // Auth check
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session && page !== 'login' && page !== 'signup') {
            navigateTo('login');
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
            case 'settings':
                html = await renderSettingsPage();
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
