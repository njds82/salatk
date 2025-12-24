// ========================================
// Statistics Page
// ========================================

function renderStatisticsPage() {
    const stats = getStatistics();
    const data = loadData();

    // Get weekly prayer data
    const weekDates = getWeekDates();
    const weeklyData = weekDates.map(date => {
        if (!data.prayers[date]) return 0;
        return Object.values(data.prayers[date]).filter(p => p.status === 'done').length;
    });

    const weekLabels = weekDates.map(date => {
        const d = new Date(date + 'T00:00:00');
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return getCurrentLanguage() === 'ar'
            ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'][d.getDay()]
            : dayNames[d.getDay()];
    });

    // Calculate completion rate
    const totalPossiblePrayers = Object.keys(data.prayers).length * 5; // 5 required prayers per day
    const completionRate = totalPossiblePrayers > 0
        ? (stats.prayersPerformed / totalPossiblePrayers) * 100
        : 0;

    // Get level info
    const level = getUserLevel(stats.totalPoints);
    const levelProgress = getLevelProgress(stats.totalPoints);
    const pointsForNext = getPointsForNextLevel(stats.totalPoints);

    let html = `
        <div class="page-header">
            <h1 class="page-title">${t('statistics_title')}</h1>
            <p class="page-subtitle">${t('statistics_subtitle')}</p>
        </div>
        
        <!-- Points & Level -->
        <div class="card" style="margin-bottom: var(--spacing-lg); text-align: center; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white;">
            <h2 style="font-size: 3rem; margin-bottom: var(--spacing-sm);">${stats.totalPoints}</h2>
            <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: var(--spacing-md);">${t('your_points')}</p>
            <div style="background: rgba(255, 255, 255, 0.2); padding: var(--spacing-sm) var(--spacing-lg); border-radius: var(--radius-full); display: inline-block;">
                <span style="font-weight: 600;">${t('level')}: ${t(level)}</span>
            </div>
            ${pointsForNext > 0 ? `
                <p style="margin-top: var(--spacing-sm); opacity: 0.8; font-size: 0.875rem;">
                    ${pointsForNext} ${t('points_plural')} للمستوى التالي
                </p>
            ` : ''}
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
            <div class="card" style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success); margin-bottom: var(--spacing-xs);">
                    ${stats.prayersPerformed}
                </div>
                <p style="color: var(--color-text-secondary);">${t('prayers_performed')}</p>
            </div>
            
            <div class="card" style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-error); margin-bottom: var(--spacing-xs);">
                    ${stats.prayersMissed}
                </div>
                <p style="color: var(--color-text-secondary);">${t('prayers_missed')}</p>
            </div>
            
            <div class="card" style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary); margin-bottom: var(--spacing-xs);">
                    ${stats.totalRakaat}
                </div>
                <p style="color: var(--color-text-secondary);">${t('total_rakaat_prayed')}</p>
            </div>
            
            <div class="card" style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-worship); margin-bottom: var(--spacing-xs);">
                    ${stats.worshipCount}
                </div>
                <p style="color: var(--color-text-secondary);">${t('worship_count')}</p>
            </div>
            
            <div class="card" style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-warning); margin-bottom: var(--spacing-xs);">
                    ${stats.daysWithoutSin}
                </div>
                <p style="color: var(--color-text-secondary);">${t('days_without_sin')}</p>
            </div>
        </div>
        
        <!-- Completion Rate -->
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div style="display: flex; justify-content: center;">
                ${createDonutChart(completionRate, t('completion_rate'))}
            </div>
        </div>
        
        <!-- Weekly Chart -->
        <div class="card">
            ${createBarChart(weeklyData, weekLabels, t('weekly_progress'))}
        </div>
    `;

    return html;
}
