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
                    <div style="text-align: center; padding: var(--spacing-sm); background: var(--color-bg-primary); border-radius: 8px; border: 1px solid var(--color-warning);">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--color-warning);">
                            ⭐ <span id="accountTotalPoints">0</span>
                        </div>
                        <div style="font-size: 0.75em; color: var(--color-text-secondary); margin-top: 4px;">${t('your_points')}</div>
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
        
        <!-- Referral System -->
        <div class="card" style="margin-bottom: var(--spacing-lg); border: 2px solid var(--color-success); background: linear-gradient(135deg, hsla(145, 77%, 70%, 0.1), hsla(145, 47%, 55%, 0.1));">
            <h3 style="margin-bottom: var(--spacing-md); color: var(--color-success);">${t('referral_section_title')}</h3>
            
            <div style="background: var(--color-bg-elevated); padding: var(--spacing-md); border-radius: 12px; margin-bottom: var(--spacing-md); text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 0.9em; color: var(--color-text-secondary);">${t('your_referral_code')}</p>
                <div style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm);">
                    <div style="font-size: 1.8em; font-weight: bold; color: var(--color-primary); letter-spacing: 2px; padding: 4px 12px; background: var(--color-bg-primary); border-radius: 8px; border: 1px dashed var(--color-primary);">
                        ${profile?.referral_code || '------'}
                    </div>
                    <button class="btn btn-secondary" onclick="copyReferralCode('${profile?.referral_code || ''}')" style="padding: 8px;">
                        📋
                    </button>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 0.8em; color: var(--color-text-tertiary);">${t('referral_code_hint')}</p>
            </div>

            ${!profile?.referred_by ? `
                <div style="background: var(--color-bg-elevated); padding: var(--spacing-md); border-radius: 12px;">
                    <label style="display: block; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 8px;">${t('enter_referral_code')}</label>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <input type="text" id="referralCodeInput" maxlength="6" 
                               style="flex: 1; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary); text-transform: uppercase; text-align: center; font-weight: bold; letter-spacing: 2px;">
                        <button class="btn btn-primary" onclick="handleApplyReferralCode()">
                            ${t('apply_code_button')}
                        </button>
                    </div>
                </div>
            ` : ''}
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
                    🔄 ${t('force_sync')}
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
                ${t('version')} 3.2.6
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

        <!-- Share App -->
        <div style="margin-top: var(--spacing-lg); margin-bottom: var(--spacing-xl); text-align: center;">
            <button class="btn btn-primary" onclick="handleShareApp('${profile?.referral_code || ''}')" style="width: 100%; padding: 16px; font-size: 1.1em; border-radius: 50px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
                📢 ${t('share_app_button')}
            </button>
        </div>
    `;

    return html;
}

// Handle theme change
async function handleThemeChange(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Save to localStorage immediately
    localStorage.setItem('salatk_theme', theme);

    // Background cloud save
    SettingsService.set('theme', theme);

    // Update sun/moon icons
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    const darkThemes = ['dark', 'midnight', 'nightsky', 'darkstars', 'metalknight'];
    const isDark = darkThemes.includes(theme);

    if (sunIcon && moonIcon) {
        if (isDark) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Only refresh settings page if we are on it
    if (window.currentPage === 'settings') {
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
    showToast(t('syncing_message'), 'info');
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
                showToast(t('sync_success'), 'success');
                // Refresh data
                await SyncManager.pullAllData();
                renderPage('settings', true);
            } else {
                showToast(t('sync_error'), 'error');
            }
        } catch (error) {
            console.error(error);
            showToast(t('sync_error'), 'error');
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
        const stats = await getStatistics();

        // Total prayers
        const totalPrayersEl = document.getElementById('accountTotalPrayers');
        if (totalPrayersEl) totalPrayersEl.textContent = stats.prayersPerformed;

        // Total habits
        const totalHabitsEl = document.getElementById('accountTotalHabits');
        if (totalHabitsEl) totalHabitsEl.textContent = stats.worshipCount;

        // Total points
        const totalPointsEl = document.getElementById('accountTotalPoints');
        if (totalPointsEl) totalPointsEl.textContent = stats.totalPoints.toLocaleString();

        // Member since
        const user = await AuthManager.getCurrentUser();
        if (user?.created_at) {
            const memberDate = new Date(user.created_at);
            const now = new Date();
            const daysSince = Math.floor((now - memberDate) / (1000 * 60 * 60 * 24));
            const memberSinceEl = document.getElementById('accountMemberSince');
            if (memberSinceEl) {
                if (daysSince < 30) {
                    memberSinceEl.textContent = `${daysSince}${t('short_day')}`;
                } else if (daysSince < 365) {
                    const months = Math.floor(daysSince / 30);
                    memberSinceEl.textContent = `${months}${t('short_month')}`;
                } else {
                    const years = Math.floor(daysSince / 365);
                    memberSinceEl.textContent = `${years}${t('short_year')}`;
                }
            }
        }
    } catch (error) {
        console.error('Error updating account stats:', error);
    }
}

// Calculate prayer streak
async function calculatePrayerStreak() {
    return await PrayerService.getPrayerStreak();
}


// Referral system functions
async function handleApplyReferralCode() {
    const input = document.getElementById('referralCodeInput');
    const code = input?.value?.trim()?.toUpperCase();

    if (!code || code.length !== 6) {
        showToast(t('error_invalid_input'), 'error');
        return;
    }

    try {
        const user = await AuthManager.getCurrentUser();
        const profile = await AuthManager.getProfile();

        if (profile.referral_code === code) {
            showToast(t('error_own_code'), 'error');
            return;
        }

        if (profile.referred_by) {
            showToast(t('error_already_referred'), 'error');
            return;
        }

        showToast(t('loading_auth'), 'info');

        // Find referrer
        const { data: referrer, error: fetchError } = await window.supabaseClient
            .from('profiles')
            .select('id, referral_code')
            .eq('referral_code', code)
            .maybeSingle();

        if (fetchError || !referrer) {
            showToast(t('error_invalid_code'), 'error');
            return;
        }

        // 1. Update current profile with referred_by
        const { error: updateError } = await window.supabaseClient
            .from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 2. Award points to current user
        await window.PointsService.addPoints(7, t('referral_section_title'));

        // 3. Award points to referrer
        const { error: pointsError } = await window.supabaseClient
            .from('points_history')
            .insert({
                id: crypto.randomUUID(),
                user_id: referrer.id,
                amount: 7,
                reason: t('referral_section_title') + ' (Referrer reward)',
                recorded_at: new Date().toISOString()
            });

        if (pointsError) console.error('Failed to award points to referrer:', pointsError);

        showToast(t('referral_code_applied'), 'success');

        // Refresh page to hide input
        renderPage('settings', true);

    } catch (error) {
        console.error('Error applying referral code:', error);
        showToast(t('error_general'), 'error');
    }
}

function copyReferralCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        showToast(t('copy_success') || 'Copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function handleShareApp(code) {
    const shareMessage = t('share_message').replace('{code}', code || '------');

    if (navigator.share) {
        navigator.share({
            title: t('app_name'),
            text: shareMessage,
            url: 'https://salatk-app.pages.dev/'
        }).catch(err => {
            if (err.name !== 'AbortError') console.error(err);
        });
    } else {
        navigator.clipboard.writeText(shareMessage).then(() => {
            showToast(t('copy_success') || 'Copied!', 'success');
        });
    }
}

// Update stats when page loads
window.addEventListener('pageRendered', (e) => {
    if (e.detail?.page === 'settings') {
        setTimeout(updateAccountStats, 100);
    }
});

// Expose to window
window.handleThemeChange = handleThemeChange;


