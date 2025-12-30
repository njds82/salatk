// ========================================
// Settings Page
// ========================================

async function renderSettingsPage() {
    const settings = await SettingsService.getSettings();
    const currentTheme = settings.theme || 'light';
    const currentLang = settings.language || 'ar'; // Use settings directly, getCurrentLanguage() might still rely on something else

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
        <div class="card" style="margin-bottom: var(--spacing-lg); background: linear-gradient(135deg, hsla(262, 77%, 70%, 0.1), hsla(262, 47%, 55%, 0.1)); border: 2px solid var(--color-primary);">
            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); display: flex; align-items: center; justify-content: center; font-size: 2.5em; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    ${(profile?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <h2 style="margin: 0 0 4px 0; color: var(--color-primary); font-size: 1.5em;">${profile?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0]}</h2>
                    <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.9em;">@${user?.user_metadata?.username || user?.email?.split('@')[0] || ''}</p>
                    ${profile?.bio ? `<p style="margin: 8px 0 0 0; color: var(--color-text-tertiary); font-size: 0.875em; font-style: italic;">"${profile.bio}"</p>` : ''}
                </div>
                <button class="btn btn-secondary" onclick="toggleProfileEdit()" style="padding: 8px 16px;">
                    ✏️ ${t('edit_profile')}
                </button>
            </div>

            <!-- Profile Edit Form (Hidden by default) -->
            <div id="profileEditForm" style="display: none; background: var(--color-bg-elevated); padding: var(--spacing-md); border-radius: 12px; margin-bottom: var(--spacing-md);">
                <h4 style="margin: 0 0 var(--spacing-md) 0;">${t('edit_profile')}</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <div>
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('full_name')}</label>
                        <input type="text" id="profileNameInput" value="${profile?.full_name || ''}" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('bio')}</label>
                        <textarea id="profileBioInput" rows="3" 
                                  style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary); resize: vertical;">${profile?.bio || ''}</textarea>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
                        <button class="btn btn-primary" onclick="handleSaveProfile()" style="flex: 1;">
                            💾 ${t('save_profile')}
                        </button>
                        <button class="btn btn-secondary" onclick="toggleProfileEdit()" style="flex: 1;">
                            ${t('cancel')}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Account Statistics -->
            <div style="background: var(--color-bg-elevated); padding: var(--spacing-md); border-radius: 12px; margin-bottom: var(--spacing-md);">
                <h4 style="margin: 0 0 var(--spacing-md) 0; color: var(--color-primary);">📊 ${t('account_stats')}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--spacing-sm);">
                    <div style="text-align: center; padding: var(--spacing-sm); background: var(--color-bg-primary); border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--color-primary);" id="accountTotalPrayers">0</div>
                        <div style="font-size: 0.75em; color: var(--color-text-secondary); margin-top: 4px;">${t('total_prayers')}</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-sm); background: var(--color-bg-primary); border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--color-success);" id="accountTotalHabits">0</div>
                        <div style="font-size: 0.75em; color: var(--color-text-secondary); margin-top: 4px;">${t('total_habits')}</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-sm); background: var(--color-bg-primary); border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--color-warning);" id="accountCurrentStreak">0</div>
                        <div style="font-size: 0.75em; color: var(--color-text-secondary); margin-top: 4px;">${t('current_streak')}</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-sm); background: var(--color-bg-primary); border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--color-info);" id="accountMemberSince">-</div>
                        <div style="font-size: 0.75em; color: var(--color-text-secondary); margin-top: 4px;">${t('member_since')}</div>
                    </div>
                </div>
            </div>

            <!-- Account Actions -->
            <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                <button class="btn btn-secondary" onclick="togglePasswordChange()">
                    🔑 ${t('change_password')}
                </button>
                <button class="btn btn-danger" onclick="AuthManager.signOut()">
                    🚪 ${t('logout_button')}
                </button>
            </div>

            <!-- Password Change Form (Hidden by default) -->
            <div id="passwordChangeForm" style="display: none; background: var(--color-bg-elevated); padding: var(--spacing-md); border-radius: 12px; margin-top: var(--spacing-md);">
                <h4 style="margin: 0 0 var(--spacing-md) 0;">${t('change_password')}</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <div>
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('new_password')}</label>
                        <input type="password" id="newPasswordInput" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('confirm_password')}</label>
                        <input type="password" id="confirmPasswordInput" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);">
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
                        <button class="btn btn-primary" onclick="handleChangePassword()" style="flex: 1;">
                            💾 ${t('save')}
                        </button>
                        <button class="btn btn-secondary" onclick="togglePasswordChange()" style="flex: 1;">
                            ${t('cancel')}
                        </button>
                    </div>
                </div>
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
        
        <!-- Calculation Settings -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('calculation_settings')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                
                <!-- Method -->
                <div>
                    <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('calculation_method')}</label>
                    <select id="calcMethodSelect" class="form-control" onchange="handleCalculationSettingsChange()" 
                            style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-elevated); color: var(--color-text-primary);">
                        <option value="UmmAlQura" ${settings.calculationMethod === 'UmmAlQura' ? 'selected' : ''}>${t('method_umm_al_qura')}</option>
                        <option value="MuslimWorldLeague" ${settings.calculationMethod === 'MuslimWorldLeague' ? 'selected' : ''}>${t('method_muslim_world_league')}</option>
                        <option value="Egyptian" ${settings.calculationMethod === 'Egyptian' ? 'selected' : ''}>${t('method_egyptian')}</option>
                        <option value="Karachi" ${settings.calculationMethod === 'Karachi' ? 'selected' : ''}>${t('method_karachi')}</option>
                        <option value="Dubai" ${settings.calculationMethod === 'Dubai' ? 'selected' : ''}>${t('method_uae')}</option>
                        <option value="Kuwait" ${settings.calculationMethod === 'Kuwait' ? 'selected' : ''}>${t('method_kuwait')}</option>
                        <option value="Qatar" ${settings.calculationMethod === 'Qatar' ? 'selected' : ''}>${t('method_qatar')}</option>
                        <option value="Singapore" ${settings.calculationMethod === 'Singapore' ? 'selected' : ''}>${t('method_singapore')}</option>
                        <option value="NorthAmerica" ${settings.calculationMethod === 'NorthAmerica' ? 'selected' : ''}>${t('method_north_america')}</option>
                        <option value="Other" ${settings.calculationMethod === 'Other' ? 'selected' : ''}>${t('method_other')}</option>
                    </select>
                </div>

                <!-- Madhab -->
                <div>
                    <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('madhab')}</label>
                    <select id="madhabSelect" class="form-control" onchange="handleCalculationSettingsChange()"
                            style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-elevated); color: var(--color-text-primary);">
                        <option value="Shafi" ${settings.madhab === 'Shafi' ? 'selected' : ''}>${t('madhab_shafi')}</option>
                        <option value="Hanafi" ${settings.madhab === 'Hanafi' ? 'selected' : ''}>${t('madhab_hanafi')}</option>
                    </select>
                </div>

            </div>
        </div>
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('location_settings')}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                
                <!-- Region Select -->
                <div>
                    <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('region')}</label>
                    <select id="regionSelect" class="form-control" onchange="handleRegionChange()" 
                            style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-elevated); color: var(--color-text-primary);">
                        <option value="">${t('select_region')}</option>
                        ${Object.keys(LEVANT_REGIONS).map(country => `
                            <optgroup label="${country}">
                                ${LEVANT_REGIONS[country].map(reg => `
                                    <option value="${reg.lat},${reg.long}">${reg.name}</option>
                                `).join('')}
                            </optgroup>
                        `).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: var(--spacing-sm);">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('latitude')}</label>
                        <input type="number" id="latInput" step="any" class="form-control" value="${PrayerManager.lastLoc?.lat || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-elevated); color: var(--color-text-primary);">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 4px;">${t('longitude')}</label>
                        <input type="number" id="longInput" step="any" class="form-control" value="${PrayerManager.lastLoc?.long || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-elevated); color: var(--color-text-primary);">
                    </div>
                </div>
                <div style="display: flex; gap: var(--spacing-sm);">
                    <button class="btn btn-primary" onclick="handleSaveManualLocation()" style="flex: 1;">
                        📍 ${t('save_location')}
                    </button>
                    <!-- Auto location removed as requested -->
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
                ${t('version')} 3.2.0 ${t('demo_tag')}
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
async function handleThemeChange(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    await SettingsService.set('theme', theme);

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
        renderPage('settings', true);
    }
}

// Handle language change
async function handleLanguageChange(lang) {
    await SettingsService.set('language', lang);
    if (window.setLanguage) setLanguage(lang);
    renderPage('settings', true);
}

// Handle calculation settings change
async function handleCalculationSettingsChange() {
    const method = document.getElementById('calcMethodSelect').value;
    const madhab = document.getElementById('madhabSelect').value;

    await SettingsService.set('calculationMethod', method);
    await SettingsService.set('madhab', madhab);

    showToast(t('save_settings'), 'success');

    // Force recalculate/re-render to apply changes immediately
    if (window.currentPage === 'settings') {
        if (window.PrayerManager) PrayerManager.clearCache();
        renderPage('settings', true);
    }
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

    if (window.PrayerManager) {
        PrayerManager.saveManualLocation(lat, long);
        PrayerManager.clearCache();
    }
    showToast(t('manual_mode_on'), 'success');
    renderPage('settings', true);
}

// Handle region selection change
function handleRegionChange() {
    const select = document.getElementById('regionSelect');
    if (select.value) {
        const [lat, long] = select.value.split(',');
        document.getElementById('latInput').value = lat;
        document.getElementById('longInput').value = long;
    }
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
            await updatePointsDisplay();
            navigateTo('settings');
        } catch (error) {
            showToast(t('error_importing'), 'error');
        }
    };
    input.click();
}

// Handle clear all data
function handleClearAllData() {

    confirmDialog(t('confirm_clear_all'), async () => {
        await clearAllData();
        showToast(t('data_cleared_message'), 'info');
        await updatePointsDisplay();
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
                renderPage('settings', true);
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

// ========================================
// Account Management Functions
// ========================================

// Toggle profile edit form
function toggleProfileEdit() {
    const form = document.getElementById('profileEditForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// Toggle password change form
function togglePasswordChange() {
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// Handle save profile
async function handleSaveProfile() {
    const name = document.getElementById('profileNameInput')?.value;
    const bio = document.getElementById('profileBioInput')?.value;

    if (!name || name.trim() === '') {
        showToast(t('error_invalid_input'), 'error');
        return;
    }

    try {
        await AuthManager.updateProfile({ full_name: name, bio: bio });
        showToast(t('profile_updated'), 'success');
        toggleProfileEdit();
        renderPage('settings', true);
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast(t('error_general'), 'error');
    }
}

// Handle change password
async function handleChangePassword() {
    const newPassword = document.getElementById('newPasswordInput')?.value;
    const confirmPassword = document.getElementById('confirmPasswordInput')?.value;

    if (!newPassword || newPassword.length < 6) {
        showToast(t('error_invalid_input'), 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast(t('password_mismatch'), 'error');
        return;
    }

    try {
        const { error } = await window.supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showToast(t('password_changed'), 'success');
        togglePasswordChange();

        // Clear inputs
        document.getElementById('newPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').value = '';
    } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message || t('error_general'), 'error');
    }
}

// Calculate and display account statistics
async function updateAccountStats() {
    try {
        // Total prayers
        const totalPrayers = await db.prayers.count();
        const totalPrayersEl = document.getElementById('accountTotalPrayers');
        if (totalPrayersEl) totalPrayersEl.textContent = totalPrayers;

        // Total habits
        const totalHabits = await db.habits.count();
        const totalHabitsEl = document.getElementById('accountTotalHabits');
        if (totalHabitsEl) totalHabitsEl.textContent = totalHabits;

        // Current streak (consecutive days with prayers)
        const streak = await calculatePrayerStreak();
        const streakEl = document.getElementById('accountCurrentStreak');
        if (streakEl) streakEl.textContent = streak;

        // Member since
        const user = await AuthManager.getCurrentUser();
        if (user?.created_at) {
            const memberDate = new Date(user.created_at);
            const now = new Date();
            const daysSince = Math.floor((now - memberDate) / (1000 * 60 * 60 * 24));
            const memberSinceEl = document.getElementById('accountMemberSince');
            if (memberSinceEl) {
                if (daysSince < 30) {
                    memberSinceEl.textContent = `${daysSince}d`;
                } else if (daysSince < 365) {
                    const months = Math.floor(daysSince / 30);
                    memberSinceEl.textContent = `${months}m`;
                } else {
                    const years = Math.floor(daysSince / 365);
                    memberSinceEl.textContent = `${years}y`;
                }
            }
        }
    } catch (error) {
        console.error('Error updating account stats:', error);
    }
}

// Calculate prayer streak
async function calculatePrayerStreak() {
    try {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = formatDate(checkDate);

            // Check if user prayed at least one prayer on this day
            const prayers = await db.prayers.where({ date: dateStr }).toArray();
            const hasPrayed = prayers.some(p => p.status === 'done');

            if (hasPrayed) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

// Update stats when page loads
window.addEventListener('pageRendered', (e) => {
    if (e.detail?.page === 'settings') {
        setTimeout(updateAccountStats, 100);
    }
});


