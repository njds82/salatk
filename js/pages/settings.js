// ========================================
// Settings Page
// ========================================

async function renderSettingsPage() {
    const data = loadData();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const currentLang = getCurrentLanguage();

    // Fetch current location info for display
    const loc = await PrayerManager.getUserLocation();
    PrayerManager.lastLoc = loc; // Store temporarily for render

    const user = await AuthManager.getCurrentUser();
    const profile = await AuthManager.getProfile();

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('settings_title')}</h1>
            <p class="page-subtitle">${t('settings_subtitle')}</p>
        </div>

        <!-- Account Settings -->
        <div class="card" style="margin-bottom: var(--spacing-lg); border: 1px solid var(--color-primary);">
            <h3 style="margin-bottom: var(--spacing-md); color: var(--color-primary);">${t('account_settings')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                <p><strong>${t('logged_in_as')}:</strong> ${profile?.full_name || user?.email}</p>
                <p style="font-size: 0.875rem; color: var(--color-text-tertiary);">${user?.email || ''}</p>
                <button class="btn btn-danger" onclick="AuthManager.signOut()" style="margin-top: var(--spacing-sm);">
                    🚪 ${t('logout_button')}
                </button>
            </div>
        </div>
        
        <!-- Theme Settings -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('theme')}</h3>
            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="handleThemeChange('light')" style="flex: 1;">
                    ☀️ ${t('theme_light')}
                </button>
                <button class="btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="handleThemeChange('dark')" style="flex: 1;">
                    🌙 ${t('theme_dark')}
                </button>
            </div>
        </div>
        
        <!-- Language Settings -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('language')}</h3>
            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn ${currentLang === 'ar' ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="handleLanguageChange('ar')" style="flex: 1;">
                    ${t('language_ar')}
                </button>
                <button class="btn ${currentLang === 'en' ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="handleLanguageChange('en')" style="flex: 1;">
                    ${t('language_en')}
                </button>
            </div>
        </div>
        
        <!-- Location Settings -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('location_settings')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                <div style="display: flex; gap: var(--spacing-sm);">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('latitude')}</label>
                        <input type="number" id="latInput" step="any" class="form-control" value="${PrayerManager.lastLoc?.lat || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-secondary); color: var(--color-text-primary);">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('longitude')}</label>
                        <input type="number" id="longInput" step="any" class="form-control" value="${PrayerManager.lastLoc?.long || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-secondary); color: var(--color-text-primary);">
                    </div>
                </div>
                <div style="display: flex; gap: var(--spacing-sm);">
                    <button class="btn btn-primary" onclick="handleSaveManualLocation()" style="flex: 1;">
                        📍 ${t('save_location')}
                    </button>
                    <button class="btn btn-secondary" onclick="handleAutoLocation()" style="flex: 1;">
                        🛰️ ${t('auto_location')}
                    </button>
                </div>
            </div>
        </div>

        <!-- Data Management -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('data_management')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                <button class="btn btn-primary" onclick="handleForceSync()">
                    🔄 ${t('force_sync') || 'Force Sync'}
                </button>
                <button class="btn btn-primary" onclick="handleExportData()">
                    📥 ${t('export_data')}
                </button>
                <button class="btn btn-secondary" onclick="handleImportData()">
                    📤 ${t('import_data')}
                </button>
                <button class="btn btn-danger" onclick="handleClearAllData()">
                    🗑️ ${t('clear_all')}
                </button>
            </div>
        </div>
        
        <!-- About -->
        <div class="card" style="text-align: center; background: linear-gradient(135deg, hsla(175, 77%, 26%, 0.1), hsla(35, 92%, 33%, 0.1));">
            <h3 style="margin-bottom: var(--spacing-sm);">${t('about')}</h3>
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">
                ${t('app_name')}
            </p>
            <p style="color: var(--color-text-tertiary); font-size: 0.875rem;">
                ${t('version')} 2.0.0 ${t('demo_tag')}
            </p>
            <p style="color: var(--color-text-tertiary); font-size: 0.875rem; margin-top: var(--spacing-md);">
                ${t('app_description')}
            </p>
        </div>

        <!-- Download App -->
        <div class="card" style="text-align: center; margin-top: var(--spacing-lg); border: 2px dashed var(--color-primary-light);">
            <p style="margin-bottom: var(--spacing-sm); font-weight: 500;">${t('download_app')}</p>
            <a href="https://salatk-app.pages.dev/" target="_blank" class="btn btn-primary" style="display: inline-block; text-decoration: none;">
                🌐 salatk-app.pages.dev
            </a>
        </div>
    `;

    return html;
}

// Handle theme change
function handleThemeChange(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('salatk_theme', theme);

    // Update sun/moon icons
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }

    // Only refresh settings page if we are on it
    if (currentPage === 'settings') {
        renderPage('settings');
    }
}

// Handle language change
function handleLanguageChange(lang) {
    setLanguage(lang);
    navigateTo('settings');
}

// Handle export data
function handleExportData() {
    exportData();
    showToast(t('data_exported_message'), 'success');
}
// Handle manual location save
function handleSaveManualLocation() {
    const lat = document.getElementById('latInput').value;
    const long = document.getElementById('longInput').value;

    if (!lat || !long) {
        showToast(t('error_invalid_input'), 'error');
        return;
    }

    PrayerManager.saveManualLocation(lat, long);
    showToast(t('manual_mode_on'), 'success');
    navigateTo('settings');
}

// Handle auto location detection
function handleAutoLocation() {
    PrayerManager.clearManualLocation();
    showToast(t('auto_mode_on'), 'info');
    navigateTo('settings');
}

// Handle import data
function handleImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            await importData(file);
            showToast(t('data_imported_message'), 'success');
            updatePointsDisplay();
            navigateTo('settings');
        } catch (error) {
            showToast(t('error_importing'), 'error');
        }
    };
    input.click();
}

// Handle clear all data
function handleClearAllData() {

    confirmDialog(t('confirm_clear_all'), () => {
        clearAllData();
        showToast(t('data_cleared_message'), 'info');
        updatePointsDisplay();
        navigateTo('daily-prayers');
    });
}

// Handle force sync
async function handleForceSync() {
    showToast(t('syncing_message') || 'Syncing...', 'info');
    if (window.SyncManager) {
        try {
            // We'll push current state first to ensure local changes aren't lost if they weren't synced yet
            // However, SyncManager currently only has fine-grained object pushes.
            // Let's rely on pullAllData for now, or implement a pushAll in SyncManager.
            // A "Force Sync" usually implies "Make cloud look like me" or "Make me look like cloud".
            // Given "offline-first" style, we usually want "Push dirty, then Pull".
            // For now, let's just Pull to verify connection, as Push happens on edit.
            // If the user says "Database empty", they might have data LOCALLY they want to see in cloud.
            // So we actually need a "Push All" for existing local data that was created before sync was active.

            // NOTE: This assumes the user has local data they want to SAVE to the empty DB.
            const success = await SyncManager.pushAllLocalData();
            if (success) {
                showToast(t('sync_success') || 'Sync complete', 'success');
                // Refresh data
                await SyncManager.pullAllData();
                renderPage('settings');
            } else {
                showToast(t('sync_error') || 'Sync failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast(t('sync_error') || 'Sync failed', 'error');
        }
    } else {
        showToast(t('error_general'), 'error');
    }
}

