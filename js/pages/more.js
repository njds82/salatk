// ========================================
// More Page (Secondary Navigation)
// ========================================

async function renderMorePage() {
    const items = [
        {
            id: 'statistics',
            label: 'nav_statistics',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24"><rect x="4" y="14" width="4" height="7" stroke="currentColor" stroke-width="2" fill="none" /><rect x="10" y="9" width="4" height="12" stroke="currentColor" stroke-width="2" fill="none" /><rect x="16" y="3" width="4" height="18" stroke="currentColor" stroke-width="2" fill="none" /></svg>`,
            color: 'var(--color-info)'
        },
        {
            id: 'challenge',
            label: 'nav_challenge',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" fill="none" /></svg>`,
            color: 'var(--color-warning)'
        },
        {
            id: 'store',
            label: 'nav_store',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
            color: 'var(--color-secondary)'
        },
        {
            id: 'athkar',
            label: 'nav_athkar',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
            color: 'var(--color-success)'
        },
        {
            id: 'settings',
            label: 'nav_settings',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none" /><path d="M12 3 L12 5 M12 19 L12 21 M3 12 L5 12 M19 12 L21 12 M5.5 5.5 L7 7 M17 17 L18.5 18.5 M18.5 5.5 L17 7 M7 17 L5.5 18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>`,
            color: 'var(--color-text-secondary)' // Using secondary here as settings is utility
        }
    ];

    return `
        <div class="page-header">
            <h1 class="page-title">${t('nav_more')}</h1>
        </div>

        <div class="card-grid more-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--spacing-lg);">
            ${items.map(item => `
                <div class="card more-card" onclick="navigateTo('${item.id}')" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--spacing-xl); gap: var(--spacing-lg); transition: transform 0.2s;">
                    <div style="color: ${item.color}; transform: scale(1.5); margin-bottom: 8px;">
                        ${item.icon}
                    </div>
                    <span style="font-weight: 700; font-size: 1.1em; color: var(--color-text-primary);">${t(item.label)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Expose to window
window.renderMorePage = renderMorePage;
