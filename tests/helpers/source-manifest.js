export const CLASSIC_SOURCE_FILES = [
    'components/charts.js',
    'components/habit-card.js',
    'components/modal.js',
    'components/points-display.js',
    'components/prayer-card.js',
    'components/toast.js',
    'js/app.js',
    'js/auth-manager.js',
    'js/config.example.js',
    'js/config.js',
    'js/data-manager.js',
    'js/date-utils.js',
    'js/db.js',
    'js/i18n.js',
    'js/notification-manager.js',
    'js/pages/admin.js',
    'js/pages/athkar.js',
    'js/pages/auth.js',
    'js/pages/daily-prayers.js',
    'js/pages/daily-tasks.js',
    'js/pages/habits.js',
    'js/pages/leaderboard.js',
    'js/pages/more.js',
    'js/pages/qada-prayers.js',
    'js/pages/settings.js',
    'js/pages/statistics.js',
    'js/pages/store.js',
    'js/points-manager.js',
    'js/prayer-manager.js',
    'js/services/admin-service.js',
    'js/services/habit-service.js',
    'js/services/migration-service.js',
    'js/services/page-data-cache.js',
    'js/services/points-service.js',
    'js/services/prayer-service.js',
    'js/services/push-service.js',
    'js/services/settings-service.js',
    'js/services/task-service.js',
    'js/supabaseClient.js',
    'js/sync-manager.js',
    'js/ui-helpers.js',
    'verify_hijri.js'
];

export const MODULE_SOURCE_FILES = [
    'js/data/questions.js',
    'js/pages/challenge.js'
];

export const SW_SOURCE_FILES = [
    'sw.js'
];

export const ALL_SOURCE_FILES = [
    ...CLASSIC_SOURCE_FILES,
    ...MODULE_SOURCE_FILES,
    ...SW_SOURCE_FILES
];
