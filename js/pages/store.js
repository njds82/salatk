// ========================================
// Store Page
// ========================================

const THEMES = [
    {
        id: 'light',
        nameKey: 'theme_light',
        descKey: 'theme_light_desc',
        price: 0,
        preview: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
        id: 'dark',
        nameKey: 'theme_dark',
        descKey: 'theme_dark_desc',
        price: 0,
        preview: 'linear-gradient(135deg, #2d3436, #000000)'
    },
    {
        id: 'emerald',
        nameKey: 'Emerald', // Hardcoded for now, can add to i18n later
        descKey: 'Premium emerald green theme',
        price: 50,
        preview: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
        id: 'midnight',
        nameKey: 'Midnight Blue',
        descKey: 'Deep blue night theme',
        price: 100,
        preview: 'linear-gradient(135deg, #1e3a8a, #1e1b4b)'
    },
    {
        id: 'nightsky',
        nameKey: 'Night Sky',
        descKey: 'Sparkling stars night theme',
        price: 47,
        preview: 'linear-gradient(135deg, #4c1d95, #2e1065)'
    }
];

async function renderStorePage() {
    const settings = await SettingsService.getSettings();
    const currentThemeId = settings.theme || 'light';
    const totalPoints = await PointsService.getTotal();

    // Fetch owned themes
    const ownedThemes = await getOwnedThemes();

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('store_title')}</h1>
            <p class="page-subtitle">${t('store_subtitle')}</p>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-lg); background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: white; border: none; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <p style="margin: 0; opacity: 0.9; font-size: 0.9em;">${t('your_points')}</p>
                <h2 style="margin: 0; font-size: 2em;">⭐ ${totalPoints.toLocaleString()}</h2>
            </div>
            <div style="font-size: 2.5em; opacity: 0.5;">🛍️</div>
        </div>

        <div class="card-grid">
    `;

    THEMES.forEach(theme => {
        const isOwned = theme.price === 0 || ownedThemes.includes(theme.id);
        const isActive = currentThemeId === theme.id;
        const name = t(theme.nameKey) || theme.nameKey;
        const desc = t(theme.descKey) || theme.descKey;

        html += `
            <div class="card theme-card ${isActive ? 'active' : ''}" style="overflow: hidden; padding: 0; border: ${isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'}">
                <div style="height: 100px; background: ${theme.preview}; position: relative;">
                    ${isActive ? `<div style="position: absolute; top: 8px; right: 8px; background: var(--color-primary); color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.75em;">${t('prayer_done')}</div>` : ''}
                </div>
                <div style="padding: var(--spacing-md);">
                    <h3 style="margin: 0 0 4px 0;">${name}</h3>
                    <p style="color: var(--color-text-secondary); font-size: 0.85em; margin-bottom: var(--spacing-md); line-height: 1.4;">${desc}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                        <span style="font-weight: bold; color: ${theme.price === 0 ? 'var(--color-success)' : 'var(--color-warning)'}">
                            ${theme.price === 0 ? t('free') : `⭐ ${theme.price} ${t('points_short')}`}
                        </span>
                        
                        ${isOwned ? `
                            <button class="btn ${isActive ? 'btn-secondary' : 'btn-primary'}" 
                                    onclick="handleApplyStoreTheme('${theme.id}')" 
                                    ${isActive ? 'disabled' : ''}
                                    style="padding: 6px 16px;">
                                ${isActive ? t('owned') : t('apply')}
                            </button>
                        ` : `
                            <button class="btn btn-primary" 
                                    onclick="handlePurchaseTheme('${theme.id}', ${theme.price}, '${name}')" 
                                    style="padding: 6px 16px;">
                                ${t('buy')}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Future Designs Section
    html += `
        <div style="margin-top: var(--spacing-xl); text-align: center; padding: var(--spacing-lg); border: 2px dashed var(--color-border); border-radius: 12px; opacity: 0.7;">
            <p style="margin: 0; color: var(--color-text-secondary);">${t('premium_designs')}...</p>
            <p style="font-size: 0.8em; margin-top: 4px;">More interfaces and icons coming soon!</p>
        </div>
    `;

    return html;
}

async function getOwnedThemes() {
    if (!window.supabaseClient) return [];
    const session = await AuthManager.getSession();
    if (!session) return [];

    try {
        const { data, error } = await window.supabaseClient
            .from('owned_themes')
            .select('theme_id')
            .eq('user_id', session.user.id);

        if (error) throw error;
        return (data || []).map(t => t.theme_id);
    } catch (e) {
        console.error('Error fetching owned themes:', e);
        return [];
    }
}

async function handleApplyStoreTheme(themeId) {
    if (window.handleThemeChange) {
        await handleThemeChange(themeId);
    } else {
        document.documentElement.setAttribute('data-theme', themeId);
        await SettingsService.set('theme', themeId);
    }

    // Refresh the store page UI to show active state
    if (currentPage === 'store') {
        renderPage('store', true);
    }

    showToast(t('theme_updated') || 'Theme updated!', 'success');
}

async function handlePurchaseTheme(themeId, price, themeName) {
    try {
        const totalPoints = await PointsService.getTotal();

        if (totalPoints < price) {
            showToast(t('insufficient_points'), 'error');
            return;
        }

        const confirmMsg = t('purchase_confirm').replace('{name}', themeName).replace('{price}', price);
        const confirmed = confirm(confirmMsg);
        if (!confirmed) return;

        showToast(t('loading_auth') || 'Processing...', 'info');

        const session = await AuthManager.getSession();
        if (!session) {
            showToast(t('error_login_required'), 'error');
            return;
        }

        // 1. Record ownership
        const { error: purchaseError } = await window.supabaseClient
            .from('owned_themes')
            .upsert({
                user_id: session.user.id,
                theme_id: themeId
            }, { onConflict: 'user_id,theme_id' });

        if (purchaseError) throw purchaseError;

        // 2. Deduct points
        const success = await PointsService.addPoints(-price, `Purchase Theme: ${themeName}`);
        if (!success) {
            console.error('Points deduction failed but theme was recorded.');
        }

        showToast(t('purchase_success'), 'success');

        // Refresh UI
        if (typeof renderPage === 'function') {
            renderPage('store', true);
        }
    } catch (e) {
        console.error('Purchase failed:', e);
        showToast(t('error_general'), 'error');
    }
}

// exposing functions to global scope for onclick attributes
window.handleApplyStoreTheme = handleApplyStoreTheme;
window.handlePurchaseTheme = handlePurchaseTheme;
