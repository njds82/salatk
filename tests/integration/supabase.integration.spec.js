import { createClient } from '@supabase/supabase-js';
import { createBootstrappedWindow } from '../helpers/bootstrap.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const hasLocalSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const describeLocal = hasLocalSupabase ? describe : describe.skip;

describeLocal('Supabase Local Integration', () => {
    let client;
    let session;

    async function ensureSession() {
        const email = `salatk_test_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
        const password = 'StrongPass123!';

        const signUpResult = await client.auth.signUp({ email, password });
        if (signUpResult.error && !signUpResult.error.message.toLowerCase().includes('already registered')) {
            throw signUpResult.error;
        }

        if (signUpResult.data?.session) {
            return signUpResult.data.session;
        }

        const signInResult = await client.auth.signInWithPassword({ email, password });
        if (signInResult.error) {
            throw signInResult.error;
        }

        return signInResult.data.session;
    }

    beforeAll(async () => {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        session = await ensureSession();
        expect(session?.user?.id).toBeTruthy();
    });

    it('task-service performs full CRUD lifecycle', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                async getSession() {
                    return session;
                }
            },
            scripts: ['js/services/points-service.js', 'js/services/task-service.js']
        });

        const today = window.getCurrentDate();

        const created = await window.TaskService.createTask({
            title: 'Integration task',
            priority: 'medium',
            dueDate: today
        });

        expect(created.id).toBeTruthy();

        const fetched = await window.TaskService.getTaskById(created.id);
        expect(fetched.title).toBe('Integration task');

        const updated = await window.TaskService.updateTask(created.id, {
            title: 'Integration task updated',
            priority: 'high'
        });
        expect(updated.priority).toBe('high');

        const toggled = await window.TaskService.toggleTaskStatus(created.id, 'completed');
        expect(toggled.status).toBe('completed');

        const stats = await window.TaskService.getDailyTaskStats(today);
        expect(stats.total).toBeGreaterThanOrEqual(1);

        cleanup();
    });

    it('prayer-service handles missed/done and qada lifecycle', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                async getSession() {
                    return session;
                }
            },
            scripts: ['js/services/points-service.js', 'js/services/prayer-service.js']
        });

        const date = window.getCurrentDate();

        const missed = await window.PrayerService.markPrayer('fajr', date, 'missed');
        expect(missed.success).toBe(true);

        const qadas = await window.PrayerService.getQadaPrayers();
        expect(Array.isArray(qadas)).toBe(true);

        const done = await window.PrayerService.markPrayer('fajr', date, 'done');
        expect(done.success).toBe(true);

        cleanup();
    });

    it('habit-service writes actions and computes stats', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                async getSession() {
                    return session;
                }
            },
            scripts: ['js/services/points-service.js', 'js/services/habit-service.js']
        });

        const added = await window.HabitService.add('Integration Habit', 'worship');
        expect(added.id).toBeTruthy();

        await window.HabitService.logAction(added.id, window.getCurrentDate(), 'done');

        const stats = await window.HabitService.getStats(added.id);
        expect(stats.totalLoggedDays).toBeGreaterThanOrEqual(1);

        cleanup();
    });

    it('points-service writes and reads totals/history', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                async getSession() {
                    return session;
                }
            },
            scripts: ['js/services/points-service.js']
        });

        const added = await window.PointsService.addPoints(2, 'integration_points_test', `int:${Date.now()}`);
        expect(added).toBe(true);

        const total = await window.PointsService.getTotal();
        expect(Number.isFinite(total)).toBe(true);

        const history = await window.PointsService.getHistory();
        expect(Array.isArray(history)).toBe(true);

        cleanup();
    });

    it('settings-service persists user settings', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                async getSession() {
                    return session;
                }
            },
            scripts: ['js/services/settings-service.js']
        });

        await window.SettingsService.set('theme', 'dark');
        await window.SettingsService.set('language', 'en');

        const settings = await window.SettingsService.getSettings();
        expect(settings.theme).toBe('dark');
        expect(settings.language).toBe('en');

        cleanup();
    });

    it('admin RPC returns false for non-admin integration users', async () => {
        const { data, error } = await client.rpc('is_current_user_admin');
        expect(error).toBeNull();
        expect(data).toBe(false);
    });

    it('non-admin user cannot read admin audit logs rows', async () => {
        const { data, error } = await client
            .from('admin_audit_logs')
            .select('id,action,created_at')
            .limit(5);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
    });
});

if (!hasLocalSupabase) {
    describe('Supabase Local Integration', () => {
        it('is skipped when SUPABASE_URL and SUPABASE_ANON_KEY are missing', () => {
            expect(hasLocalSupabase).toBe(false);
        });
    });
}
