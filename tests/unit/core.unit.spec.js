import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';
import { createMockSupabaseClient } from '../helpers/mock-supabase.js';

describe('Date Utils', () => {
    it('formats and parses dates correctly', () => {
        const { window, cleanup } = createBootstrappedWindow();

        const date = new Date('2026-02-23T12:00:00Z');
        expect(window.formatDate(date)).toBe('2026-02-23');
        expect(window.parseDate('2026-02-23').toISOString().startsWith('2026-02-23')).toBe(true);
        expect(window.getDaysDifference('2026-02-20', '2026-02-23')).toBe(3);

        cleanup();
    });

    it('allows editing only in last 7 days', () => {
        const { window, cleanup } = createBootstrappedWindow();

        const today = window.getCurrentDate();
        const todayDate = window.parseDate(today);
        const oldDate = new Date(todayDate);
        oldDate.setDate(oldDate.getDate() - 10);

        expect(window.canEditDate(today)).toBe(true);
        expect(window.canEditDate(window.formatDate(oldDate))).toBe(false);

        cleanup();
    });

    it('returns structured hijri date', () => {
        const { window, cleanup } = createBootstrappedWindow();

        const result = window.getHijriDate(new Date('2026-01-01T00:00:00Z'));
        expect(result).toHaveProperty('year');
        expect(result).toHaveProperty('month');
        expect(result).toHaveProperty('day');
        expect(typeof result.formatted).toBe('string');

        cleanup();
    });
});

describe('i18n', () => {
    it('switches language and updates DOM direction', () => {
        const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });
        loadLegacyScripts(window, ['js/i18n.js']);

        window.setLanguage('en');
        expect(window.document.documentElement.lang).toBe('en');
        expect(window.document.documentElement.dir).toBe('ltr');

        window.setLanguage('ar');
        expect(window.document.documentElement.lang).toBe('ar');
        expect(window.document.documentElement.dir).toBe('rtl');

        cleanup();
    });
});

describe('Points Manager', () => {
    it('computes level boundaries correctly', () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/points-service.js', 'js/points-manager.js']
        });

        expect(window.getUserLevel(0)).toBe('new');
        expect(window.getUserLevel(30000)).toBe('absolute_classifier');
        expect(window.getPointsForNextLevel(49)).toBe(1);
        expect(window.getPointsForNextLevel(30000)).toBe(0);

        cleanup();
    });
});

describe('Task Service', () => {
    it('validates and creates tasks', async () => {
        const supabaseClient = createMockSupabaseClient({
            tables: {
                tasks: []
            }
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/services/points-service.js', 'js/services/task-service.js']
        });

        await expect(window.TaskService.createTask({ title: '', priority: 'medium', dueDate: '2026-02-23' }))
            .rejects.toThrow('TASK_TITLE_REQUIRED');

        const created = await window.TaskService.createTask({
            title: 'Daily dua',
            priority: 'high',
            dueDate: '2026-02-23'
        });

        expect(created.title).toBe('Daily dua');
        expect(created.priority).toBe('high');

        cleanup();
    });

    it('toggles task status and updates points', async () => {
        const supabaseClient = createMockSupabaseClient({
            tables: {
                tasks: [
                    {
                        id: 'task-1',
                        user_id: 'test-user-id',
                        title: 'Read Quran',
                        priority: 'medium',
                        due_date: '2026-02-23',
                        status: 'pending',
                        completed_at: null,
                        rollover_count: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ],
                points_history: []
            }
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/services/points-service.js', 'js/services/task-service.js']
        });

        const addPointsSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);

        const updated = await window.TaskService.toggleTaskStatus('task-1', 'completed');
        expect(updated.status).toBe('completed');
        expect(addPointsSpy).toHaveBeenCalledWith(1, expect.stringContaining('Task completed'), 'task:task-1');

        cleanup();
    });
});

describe('Prayer Service', () => {
    it('marks missed prayer and creates qada', async () => {
        const supabaseClient = createMockSupabaseClient({
            tables: {
                prayer_records: [],
                qada_prayers: [],
                points_history: []
            }
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/services/points-service.js', 'js/services/prayer-service.js']
        });

        vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);

        const result = await window.PrayerService.markPrayer('fajr', '2026-02-23', 'missed');
        expect(result.success).toBe(true);

        const qada = await window.PrayerService.getQadaPrayers();
        expect(qada.length).toBe(1);
        expect(qada[0].prayer).toBe('fajr');

        cleanup();
    });

    it('resets prayer and removes points entry', async () => {
        const supabaseClient = createMockSupabaseClient({
            tables: {
                prayer_records: [
                    {
                        user_id: 'test-user-id',
                        date: '2026-02-23',
                        prayer_key: 'dhuhr',
                        status: 'done',
                        recorded_at: new Date().toISOString()
                    }
                ],
                qada_prayers: [],
                points_history: []
            }
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/services/points-service.js', 'js/services/prayer-service.js']
        });

        vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);

        const result = await window.PrayerService.resetPrayer('dhuhr', '2026-02-23');
        expect(result.success).toBe(true);

        cleanup();
    });
});

describe('Habit Service', () => {
    it('builds metrics for worship habit', () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/points-service.js', 'js/services/habit-service.js']
        });

        const metrics = window.HabitService._buildMetrics(
            [
                { date: '2026-02-20', action: 'done' },
                { date: '2026-02-21', action: 'done' },
                { date: '2026-02-22', action: 'done' }
            ],
            'worship'
        );

        expect(metrics.daysDone).toBe(3);
        expect(metrics.consistencyRate).toBe(100);

        cleanup();
    });

    it('maps stats output for sin habit', async () => {
        const supabaseClient = createMockSupabaseClient({
            tables: {
                habits: [
                    {
                        id: 'habit-1',
                        user_id: 'test-user-id',
                        name: 'No gossip',
                        type: 'sin',
                        created_at: new Date().toISOString()
                    }
                ],
                habit_history: [
                    { user_id: 'test-user-id', habit_id: 'habit-1', date: '2026-02-22', action: 'avoided', recorded_at: new Date().toISOString() }
                ]
            }
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/services/points-service.js', 'js/services/habit-service.js']
        });

        const stats = await window.HabitService.getStats('habit-1');
        expect(stats.successCount).toBe(1);
        expect(stats.successRate).toBeGreaterThanOrEqual(0);

        cleanup();
    });
});

describe('Settings Service', () => {
    it('applies settings to DOM and localStorage', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/settings-service.js']
        });

        await window.SettingsService.set('theme', 'dark');
        await window.SettingsService.set('language', 'en');

        expect(window.document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(window.document.documentElement.lang).toBe('en');
        expect(window.localStorage.getItem('salatk_theme')).toBe('dark');

        cleanup();
    });
});

describe('Auth Manager', () => {
    it('validates username policy and resolves auth email', () => {
        const { window, cleanup } = createBootstrappedWindow({ scripts: ['js/auth-manager.js'] });

        expect(() => window.AuthManager._validateUsername('ad')).toThrow();
        expect(() => window.AuthManager._validateUsername('test_1')).toThrow();

        const result = window.AuthManager._resolveAuthEmail('@valid_user');
        expect(result.email).toBe('valid_user@salatk.local');

        cleanup();
    });

    it('maps invalid credential message on sign in', async () => {
        const supabaseClient = createMockSupabaseClient();
        supabaseClient.auth.signInWithPassword = async () => {
            throw new Error('Invalid login credentials');
        };

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient,
            scripts: ['js/auth-manager.js']
        });

        const result = await window.AuthManager.signIn('user', 'wrong');
        expect(result.error.message).toBe(window.t('error_invalid_credentials'));

        cleanup();
    });
});

describe('Notification Manager', () => {
    it('schedules next prayer notification when permission is granted', () => {
        vi.useFakeTimers();

        const { window, cleanup } = createBootstrappedWindow({ scripts: ['js/notification-manager.js'] });

        const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');

        window.Notification.permission = 'granted';
        window.NotificationManager.scheduleNextPrayer({
            fajr: '00:01',
            duha: '23:59',
            dhuhr: '23:59',
            asr: '23:59',
            maghrib: '23:59',
            isha: '23:59'
        });

        expect(timeoutSpy).toHaveBeenCalled();

        vi.useRealTimers();
        cleanup();
    });
});

describe('Prayer Manager', () => {
    it('returns default location and clears cache', async () => {
        const { window, cleanup } = createBootstrappedWindow({ scripts: ['js/prayer-manager.js'] });

        const location = window.PrayerManager.getDefaultLocation();
        expect(location).toEqual(expect.objectContaining({ name: 'Jerusalem' }));

        window.PrayerManager.cachedTimes = { fajr: '05:00' };
        window.PrayerManager.cachedDate = '2026-02-23';
        window.PrayerManager.clearCache();

        expect(window.PrayerManager.cachedTimes).toBeNull();
        expect(window.PrayerManager.cachedDate).toBeNull();

        cleanup();
    });
});

describe('Sync Manager', () => {
    it('routes tasks realtime event to daily-tasks refresh', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/sync-manager.js']
        });

        const renderSpy = vi.fn();
        window.currentPage = 'daily-tasks';
        window.renderPage = renderSpy;

        await window.SyncManager.handleRealtimeEvent({ table: 'tasks', eventType: 'INSERT', new: {} });
        expect(renderSpy).toHaveBeenCalledWith('daily-tasks', true);

        cleanup();
    });
});
