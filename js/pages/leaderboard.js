// ========================================
// Leaderboard Page
// ========================================

async function renderLeaderboardPage() {
    let leaderboardData = [];
    let errorMessage = null;
    let currentUserSession = null;

    try {
        // Check if user is authenticated
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        currentUserSession = session;

        if (!session) {
            errorMessage = 'يجب تسجيل الدخول لعرض لوحة المتصدرين';
            console.warn('User not authenticated');
        } else {
            // Try to fetch from leaderboard view
            const { data, error } = await window.supabaseClient
                .from('leaderboard')
                .select('*')
                .order('ranking', { ascending: true })
                .limit(100);

            if (error) {
                console.error('Error fetching leaderboard:', error);

                // Check if the error is because the view doesn't exist
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    errorMessage = 'لوحة المتصدرين غير مُفعّلة. يرجى تشغيل سكريبت SQL: supabase_leaderboard_view.sql';
                } else {
                    errorMessage = t('error_fetching_leaderboard');
                }

                showToast(errorMessage, 'error');
            } else {
                leaderboardData = data || [];
                console.log('Leaderboard data fetched:', leaderboardData.length, 'users');
            }
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        errorMessage = t('error_fetching_leaderboard');
        showToast(errorMessage, 'error');
    }

    const top3 = leaderboardData.slice(0, 3);
    const others = leaderboardData.slice(3);
    const currentUserId = currentUserSession?.user?.id;

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('leaderboard_title')}</h1>
            <p class="page-subtitle">${t('leaderboard_subtitle')}</p>
        </div>

        ${errorMessage ? `
            <div class="card" style="padding: 40px; text-align: center;">
                <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #f5576c; margin-bottom: 15px;">خطأ في تحميل البيانات</h3>
                <p style="color: #666; margin-bottom: 20px;">${errorMessage}</p>
                ${errorMessage.includes('SQL') ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: right; margin-top: 20px;">
                        <h4 style="margin-bottom: 10px;">📝 خطوات الإصلاح:</h4>
                        <ol style="text-align: right; color: #333; line-height: 1.8;">
                            <li>افتح لوحة تحكم Supabase</li>
                            <li>انتقل إلى SQL Editor</li>
                            <li>قم بتشغيل الملف: <code style="background: #e9ecef; padding: 2px 8px; border-radius: 4px;">supabase_leaderboard_view.sql</code></li>
                            <li>أعد تحميل الصفحة</li>
                        </ol>
                    </div>
                ` : ''}
            </div>
        ` : `
            <div class="podium-container">
                ${renderPodium(top3)}
            </div>

            <div class="leaderboard-list card">
                <div class="list-header">
                    <span>${t('rank_header')}</span>
                    <span>${t('user_header')}</span>
                    <span>${t('points_header')}</span>
                </div>
                <div class="list-body">
                    ${others.map((user, index) => {
        const isCurrentUser = user.user_id === currentUserId;
        return `
                            <div class="list-item ${isCurrentUser ? 'current-user' : ''}" style="animation-delay: ${0.8 + (index * 0.1)}s">
                                <span class="rank-number">#${user.ranking}</span>
                                <div class="user-info">
                                    <span class="user-name">${user.full_name} ${isCurrentUser ? `<span class="badge badge-primary" style="font-size: 0.7rem; margin: 0 5px;">${t('you')}</span>` : ''}</span>
                                </div>
                                <span class="points-value">${user.total_points}</span>
                            </div>
                        `;
    }).join('')}
                    ${leaderboardData.length === 0 ? `<p class="empty-state">${t('no_leaderboard_data')}</p>` : ''}
                </div>
            </div>
        `}
    `;

    // Trigger animations after a short delay
    setTimeout(() => {
        document.querySelectorAll('.podium-item, .list-item').forEach(el => {
            el.classList.add('animate');
        });
    }, 100);

    return html;
}

function renderPodium(topUsers) {
    return `
        <div class="podium">
            ${topUsers[1] ? `
            <div class="podium-item silver">
                <div class="avatar-container">
                    <img src="assets/images/silver-medal.png" alt="Silver" class="medal-icon">
                </div>
                <div class="podium-step">
                    <span class="podium-name">${topUsers[1].full_name}</span>
                    <span class="podium-points">${topUsers[1].total_points}</span>
                </div>
            </div>
            ` : ''}

            ${topUsers[0] ? `
            <div class="podium-item gold">
                <div class="avatar-container">
                    <img src="assets/images/gold-medal.png" alt="Gold" class="medal-icon">
                    <div class="crown">👑</div>
                </div>
                <div class="podium-step">
                    <span class="podium-name">${topUsers[0].full_name}</span>
                    <span class="podium-points">${topUsers[0].total_points}</span>
                </div>
            </div>
            ` : ''}

            ${topUsers[2] ? `
            <div class="podium-item bronze">
                <div class="avatar-container">
                    <img src="assets/images/bronze-medal.png" alt="Bronze" class="medal-icon">
                </div>
                <div class="podium-step">
                    <span class="podium-name">${topUsers[2].full_name}</span>
                    <span class="podium-points">${topUsers[2].total_points}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

