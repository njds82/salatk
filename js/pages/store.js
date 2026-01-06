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
    },
    {
        id: 'darkstars',
        nameKey: 'Dark Sun',
        descKey: 'Night mode with golden stars',
        price: 65,
        preview: 'linear-gradient(135deg, #0f172a, #000000)'
    },
    {
        id: 'metalknight',
        nameKey: 'Metal Knight',
        descKey: 'Polished steel and armor theme',
        price: 85,
        preview: 'linear-gradient(135deg, #475569, #1e293b)'
    },
    {
        id: 'whitemarble',
        nameKey: 'White Marble',
        descKey: 'Elegant white marble with gold accents',
        price: 75,
        preview: 'linear-gradient(135deg, #ffffff, #f1f5f9)'
    },
    {
        id: 'visualnoise',
        nameKey: 'Visual Buzz',
        descKey: 'Vibrant neon theme with energetic vibes',
        price: 95,
        preview: 'linear-gradient(135deg, #ff00ff, #00ffff)'
    },
    {
        id: 'antimatter',
        nameKey: 'Antimatter',
        descKey: 'The absolute dark void theme',
        price: 110,
        preview: 'linear-gradient(135deg, #000000, #1a0033)'
    },
    {
        id: 'redmountain',
        nameKey: 'Red Mountain',
        descKey: 'Majestic peaks with warm sunset glow',
        price: 88,
        preview: 'linear-gradient(135deg, #991b1b, #450a0a)'
    },
    {
        id: 'pitchblack',
        nameKey: 'Pitch Black',
        descKey: 'Ultimate high-contrast monochrome dark theme',
        price: 125,
        preview: 'linear-gradient(135deg, #000000, #333333)'
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

        // Use flexbox to ensure the footer (buttons) stays at the bottom
        html += `
            <div class="card theme-card ${isActive ? 'active' : ''}" style="overflow: hidden; padding: 0; border: ${isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'}; display: flex; flex-direction: column;">
                <div style="height: 100px; background: ${theme.preview}; position: relative; border-bottom: 1px solid var(--color-border);">
                    ${isActive ? `<div style="position: absolute; top: 8px; right: 8px; background: var(--color-primary); color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.75em; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${t('prayer_done')}</div>` : ''}
                </div>
                <div style="padding: var(--spacing-md); flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin: 0 0 4px 0;">${name}</h3>
                    <p style="color: var(--color-text-secondary); font-size: 0.85em; margin-bottom: var(--spacing-md); line-height: 1.4; flex: 1;">${desc}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--spacing-md); border-top: 1px dashed var(--color-border);">
                        <span style="font-weight: bold; color: ${theme.price === 0 ? 'var(--color-success)' : 'var(--color-warning)'}">
                            ${theme.price === 0 ? t('free') : `⭐ ${theme.price}`}
                        </span>
                        
                        ${isOwned ? `
                            <button class="btn ${isActive ? 'btn-secondary' : 'btn-primary'}" 
                                    onclick="handleApplyStoreTheme('${theme.id}')" 
                                    ${isActive ? 'disabled' : ''}
                                    style="padding: 6px 16px; font-size: 0.9em;">
                                ${isActive ? t('owned') : t('apply')}
                            </button>
                        ` : `
                            <button class="btn btn-primary" 
                                    onclick="handlePurchaseTheme('${theme.id}', ${theme.price}, '${name}')" 
                                    style="padding: 6px 16px; font-size: 0.9em;">
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
    // Immediate feedback
    document.documentElement.setAttribute('data-theme', themeId);

    // Optimistic UI update
    if (typeof renderPage === 'function') {
        // We set a temporary flag for the active theme so the re-render picked it up
        // or we just call renderPage with the themeId override logic.
        // Actually, renderPage calls renderStorePage which fetches settings.
        // So we need to update the settings cache in memory if possible.
        if (window.SettingsService && window.SettingsService._cache) {
            window.SettingsService._cache.theme = themeId;
        }
        renderPage('store', true);
    }

    if (window.handleThemeChange) {
        await handleThemeChange(themeId);
    } else {
        await SettingsService.set('theme', themeId);
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
