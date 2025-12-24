// ========================================
// Main App Controller
// ========================================

let currentPage = 'daily-prayers';
let selectedDate = getCurrentDate();

// Get user-specific theme key
const getThemeKey = () => {
    return AuthManager.getUserKey('salatk_theme');
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem(getThemeKey()) || 'light';
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

    // Initialize data
    loadData();

    // Initialize prayer manager
    if (window.PrayerManager) {
        PrayerManager.init().then(() => {
            // refresh if needed or just let the page load handle it
            if (currentPage === 'daily-prayers') {
                renderPage('daily-prayers');
            }
        });
    }

    // Update points display
    updatePointsDisplay();

    // Navigate to initial page
    navigateToHash();

    // Initialize notification badge
    if (window.updateNotifBadge) updateNotifBadge();
});

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
    window.addEventListener('languageChanged', () => {
        navigateTo(currentPage);
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

    // Auth Guard
    if (!AuthManager.isLoggedIn() && page !== 'login' && page !== 'signup') {
        window.location.hash = 'login';
        return;
    }

    // Toggle scroll and body classes
    if (page === 'login' || page === 'signup') {
        document.body.classList.add('auth-mode');
    } else {
        document.body.classList.remove('auth-mode');
    }

    // Render page
    renderPage(page);
}

// Navigate based on hash
function navigateToHash() {
    const isLoggedIn = AuthManager.isLoggedIn();
    const hash = window.location.hash.replace('#', '');

    if (!isLoggedIn && (hash !== 'login' && hash !== 'signup')) {
        navigateTo('login');
    } else if (isLoggedIn && (hash === 'login' || hash === 'signup' || !hash)) {
        navigateTo('daily-prayers');
    } else {
        navigateTo(hash || 'daily-prayers');
    }
}

// Render page
async function renderPage(page) {
    const content = document.getElementById('pageContent');
    content.innerHTML = `<div class="loading-spinner">${t('loading_message')}</div>`;

    let html = '';

    try {
        switch (page) {
            case 'daily-prayers':
                html = await renderDailyPrayersPage();
                break;
            case 'qada-prayers':
                html = renderQadaPrayersPage();
                break;
            case 'habits':
                html = renderHabitsPage();
                break;
            case 'statistics':
                html = renderStatisticsPage();
                break;
            case 'settings':
                html = await renderSettingsPage();
                break;
            case 'login':
                html = await renderLoginPage();
                break;
            case 'signup':
                html = await renderSignupPage();
                break;
            default:
                html = await renderDailyPrayersPage();
        }

        content.innerHTML = html;
    } catch (error) {
        console.error('Error rendering page:', error);
        content.innerHTML = '<p class="error-message">Error loading page.</p>';
    }

    // Scroll to top only if navigating to a different page
    if (window.location.hash.replace('#', '') !== page) {
        window.scrollTo(0, 0);
    }
}
