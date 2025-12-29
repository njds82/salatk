// ========================================
// Statistics Page
// ========================================

async function renderStatisticsPage() {
    const stats = await getStatistics();
    // const data = loadData(); // Deprecated

    // Get weekly prayer data (Async)
    const weekDates = getWeekDates();
    // We need to fetch prayer status for these dates.
    // Inefficient loop? Better to use db.prayers.where('date').anyOf(weekDates) if Dexie supports it easily,
    // or just fetch all prayers (already done in getStatistics? No, getStatistics fetches ALL).
    // Let's refactor: getStatistics could return the raw prayers array?
    // Or we just re-fetch for this specific chart.

    // Fetch all prayers for simplicity in calculation
    const allPrayers = await db.prayers.toArray();

    const weeklyData = weekDates.map(date => {
        const daysPrayers = allPrayers.filter(p => p.date === date);
        if (!daysPrayers.length) return 0;
        return daysPrayers.filter(p => p.status === 'done').length;
    });

    const weekLabels = weekDates.map(date => {
        const d = new Date(date + 'T00:00:00');
        return t(`day_${d.getDay()}`);
    });

    // Calculate completion rate
    // We assume 5 prayers a day * number of days tracked? 
    // Or just total performed / (total performed + total missed)?
    // Old logic: "totalPossiblePrayers = Object.keys(data.prayers).length * 5"
    // This means "days tracked * 5".
    // We can get unique dates from allPrayers.
    const uniqueDates = [...new Set(allPrayers.map(p => p.date))].length;
    const totalPossiblePrayers = uniqueDates * 5;

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
                    ${t('points_to_next_level').replace('{points}', pointsForNext)}
                </p>
            ` : ''}
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-xl);">
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
