// ========================================
// Charts Component
// ========================================

function createBarChart(data, labels, title) {
    const maxValue = Math.max(...data, 1);
    const barWidth = 100 / data.length;

    return `
        <div class="chart-container" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${title}</h3>
            <div class="bar-chart" style="display: flex; align-items: flex-end; gap: var(--spacing-xs); height: 200px; border-bottom: 2px solid var(--color-border); padding-bottom: var(--spacing-sm);">
                ${data.map((value, index) => {
        const height = (value / maxValue) * 100;
        return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xs);">
                            <div style="width: 100%; height: ${height}%; background: linear-gradient(to top, var(--color-primary), var(--color-primary-light)); border-radius: var(--radius-sm); position: relative; min-height: ${value > 0 ? '4px' : '0'};">
                                ${value > 0 ? `<span style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 600;">${value}</span>` : ''}
                            </div>
                            <span style="font-size: 0.75rem; color: var(--color-text-secondary);">${labels[index]}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function createDonutChart(percentage, label) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    return `
        <div class="donut-chart" style="text-align: center;">
            <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" stroke-width="10"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" stroke-width="10"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 1s ease;"/>
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" 
                      font-size="20" font-weight="bold" fill="var(--color-text-primary)">
                    ${Math.round(percentage)}%
                </text>
            </svg>
            <p style="margin-top: var(--spacing-sm); font-weight: 600; color: var(--color-text-secondary);">${label}</p>
        </div>
    `;
}
