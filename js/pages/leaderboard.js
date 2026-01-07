// ========================================
// Leaderboard Page
// ========================================

async function renderLeaderboardPage() {
    let leaderboardData = [];
    let errorMessage = null;
    let currentUserSession = null;
    let localTotalPoints = 0;

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        currentUserSession = session;

        // currentUserSession = session; (kept for ID check)




        if (!session) {
            errorMessage = t('error_login_required');
        } else {
            const { data, error } = await window.supabaseClient
                .from('leaderboard')
                .select('*')
                .order('total_points', { ascending: false })
                .order('full_name', { ascending: true })
                .limit(100);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    errorMessage = t('error_leaderboard_disabled');
                } else {
                    errorMessage = t('error_fetching_leaderboard');
                }
                showToast(errorMessage, 'error');
            } else {
                leaderboardData = data || [];
            }
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        errorMessage = t('error_fetching_leaderboard');
        showToast(errorMessage, 'error');
    }

    const currentUserId = currentUserSession?.user?.id;
    // Calculate max score for progress bars (avoid division by zero)
    let maxPointsInList = 0;
    if (leaderboardData.length > 0) {
        maxPointsInList = Math.max(...leaderboardData.map(u => u.total_points || 0));
    }
    const maxScore = maxPointsInList > 0 ? maxPointsInList : 1;

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('leaderboard_title')}</h1>
            <p class="page-subtitle">${t('leaderboard_subtitle')}</p>
        </div>

        ${errorMessage ? `
            <div class="card" style="padding: 40px; text-align: center;">
                <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #f5576c; margin-bottom: 15px;">${t('error_sql_help_title')}</h3>
                <p style="color: #666; margin-bottom: 20px;">${errorMessage}</p>
                ${errorMessage.includes('SQL') ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: right; margin-top: 20px;">
                        <h4 style="margin-bottom: 10px;">📝 ${t('error_sql_help_intro')}</h4>
                        <ol style="text-align: right; color: #333; line-height: 1.8;">
                            <li>${t('sql_step_1')}</li>
                            <li>${t('sql_step_2')}</li>
                            <li>${t('sql_step_3')}</li>
                            <li>${t('sql_step_4')}</li>
                        </ol>
                    </div>
                ` : ''}
            </div>
        ` : `
            <div class="leaderboard-table-container">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th class="rank-cell">${t('rank_header')}</th>
                            <th>${t('user_header')}</th>
                            <th>${t('points_header')}</th>
                            <th>${t('progress_header')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leaderboardData.map((user, index) => {
        const isCurrentUser = user.user_id === currentUserId;
        const progressPercent = Math.min(100, Math.max(0, (user.total_points / maxScore) * 100));

        // Rank Icons - Use index instead of user.ranking since ORDER BY already sorted by total_points
        const actualRank = index + 1;
        let rankDisplay = `<span class="rank-number">#${actualRank}</span>`;
        if (actualRank === 1) rankDisplay = `<span class="rank-icon">🥇</span>`;
        if (actualRank === 2) rankDisplay = `<span class="rank-icon">🥈</span>`;
        if (actualRank === 3) rankDisplay = `<span class="rank-icon">🥉</span>`;

        return `
                                <tr class="${isCurrentUser ? 'current-user-row' : ''}" style="animation: fadeIn 0.3s ease-out forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
                                    <td class="rank-cell">
                                        ${rankDisplay}
                                    </td>
                                    <td class="user-cell">
                                        <span class="user-name">
                                            ${user.full_name} 
                                            ${isCurrentUser ? `<span class="badge badge-primary" style="font-size: 0.7rem; margin: 0 5px; background: var(--color-primary); color: var(--color-text-on-primary); padding: 2px 6px; border-radius: 4px;">${t('you')}</span>` : ''}
                                        </span>
                                    </td>
                                    <td class="score-cell">
                                        ${user.total_points.toLocaleString()}
                                    </td>
                                    <td class="progress-cell">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 2px; color: var(--color-text-tertiary);">
                                            <span>${Math.round(progressPercent)}%</span>
                                        </div>
                                        <div class="progress-bar-bg">
                                            <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                                        </div>
                                    </td>
                                </tr>
                            `;
    }).join('')}
                        ${leaderboardData.length === 0 ? `
                            <tr>
                                <td colspan="4" class="empty-state">
                                    ${t('no_leaderboard_data')}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `}
    `;

    return html;
}

// Listen for points updates to refresh leaderboard
window.addEventListener('pointsUpdated', () => {
    if (window.currentPage === 'leaderboard') {
        renderPage('leaderboard', true); // true = noScroll/silent refresh
    }
});
