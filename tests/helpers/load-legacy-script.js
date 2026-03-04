import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { repoPath } from './paths.js';

export function loadLegacyScript(window, relativePath) {
    const absolutePath = repoPath(relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');

    const script = window.document.createElement('script');
    script.textContent = `${source}\n//# sourceURL=${pathToFileURL(absolutePath).href}`;
    window.document.head.appendChild(script);
}

export function loadLegacyScripts(window, relativePaths) {
    for (const relativePath of relativePaths) {
        loadLegacyScript(window, relativePath);
    }
}

export const DEFAULT_BOOT_ORDER = [
    'js/config.example.js',
    'js/i18n.js',
    'js/date-utils.js',
    'js/db.js',
    'js/services/settings-service.js',
    'js/services/prayer-service.js',
    'js/services/habit-service.js',
    'js/services/points-service.js',
    'js/services/task-service.js',
    'js/services/page-data-cache.js',
    'js/data-manager.js',
    'js/points-manager.js',
    'components/toast.js',
    'components/modal.js',
    'components/prayer-card.js',
    'components/habit-card.js',
    'components/points-display.js',
    'components/charts.js',
    'js/pages/daily-prayers.js',
    'js/pages/qada-prayers.js',
    'js/pages/habits.js',
    'js/pages/daily-tasks.js',
    'js/pages/statistics.js',
    'js/pages/settings.js',
    'js/pages/athkar.js',
    'js/prayer-manager.js',
    'js/notification-manager.js',
    'js/supabaseClient.js',
    'js/auth-manager.js',
    'js/services/admin-service.js',
    'js/services/push-service.js',
    'js/pages/auth.js',
    'js/sync-manager.js',
    'js/pages/leaderboard.js',
    'js/pages/store.js',
    'js/pages/more.js',
    'js/pages/admin.js',
    'js/ui-helpers.js',
    'js/app.js'
];
