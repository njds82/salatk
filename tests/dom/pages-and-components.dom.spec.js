import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';

describe('Components DOM behavior', () => {
    it('shows and clears notifications through toast component', () => {
        const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });
        loadLegacyScripts(window, ['js/i18n.js', 'components/toast.js']);

        window.showToast('hello', 'info');
        const toastNodes = window.document.querySelectorAll('.toast');
        expect(toastNodes.length).toBe(1);

        window.clearAllNotifications();
        expect(window.document.getElementById('notifBadge').style.display).toBe('none');

        cleanup();
    });

    it('runs confirm dialog callback', async () => {
        const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });
        loadLegacyScripts(window, ['js/i18n.js', 'components/modal.js']);

        const callback = vi.fn(async () => { });
        window.confirmDialog('Confirm?', callback);

        const buttons = [...window.document.querySelectorAll('#modalOverlay .btn')];
        const confirm = buttons[1];
        expect(confirm).toBeTruthy();

        await confirm.onclick();
        expect(callback).toHaveBeenCalled();

        cleanup();
    });

    it('renders prayer and chart components', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/points-service.js',
                'js/services/prayer-service.js',
                'components/prayer-card.js',
                'components/charts.js'
            ]
        });

        const card = window.createPrayerCard('fajr', null, '05:10', true);
        expect(card).toContain('05:10');

        const bar = window.createBarChart([1, 2, 3], ['a', 'b', 'c'], 'title');
        expect(bar).toContain('chart-container');

        const donut = window.createDonutChart(66, 'rate');
        expect(donut).toContain('%');

        cleanup();
    });
});

describe('Pages render and handlers', () => {
    it('renders daily tasks page', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['components/modal.js', 'components/toast.js', 'js/pages/daily-tasks.js']
        });

        window.TaskService = {
            async getTasksByFilter() {
                return [{
                    id: 't1',
                    title: 'Task <unsafe>',
                    priority: 'high',
                    dueDate: window.getCurrentDate(),
                    status: 'pending'
                }];
            },
            async getDailyTaskStats() {
                return { total: 1, done: 0, pending: 1, rate: 0 };
            },
            async createTask() { return {}; },
            async updateTask() { return {}; },
            async toggleTaskStatus() { return {}; },
            async deleteTask() { return true; },
            async getTaskById() {
                return {
                    id: 't1',
                    title: 'Task',
                    priority: 'medium',
                    dueDate: window.getCurrentDate(),
                    status: 'pending'
                };
            }
        };

        window.renderPage = vi.fn();
        const html = await window.renderDailyTasksPage();
        expect(html).toContain('task-card');
        expect(html).toContain('task-card');

        cleanup();
    });

    it('renders qada page and handles empty state', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/prayer-service.js', 'js/pages/qada-prayers.js']
        });

        window.PrayerService.getQadaPrayers = async () => [];
        const html = await window.renderQadaPrayersPage();
        expect(html).toContain('empty-state');

        cleanup();
    });

    it('renders grouped qada cards by prayer type with counts', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/prayer-service.js', 'js/pages/qada-prayers.js']
        });

        window.PrayerService.getQadaPrayers = async () => ([
            { id: 'f3', prayer: 'fajr', date: null, rakaat: 2, timestamp: Date.now(), manual: false },
            { id: 'i2', prayer: 'isha', date: null, rakaat: 4, timestamp: Date.now() - 1, manual: false },
            { id: 'f2', prayer: 'fajr', date: null, rakaat: 2, timestamp: Date.now() - 2, manual: false },
            { id: 'f1', prayer: 'fajr', date: null, rakaat: 2, timestamp: Date.now() - 3, manual: false },
            { id: 'i1', prayer: 'isha', date: null, rakaat: 4, timestamp: Date.now() - 4, manual: false }
        ]);

        const html = await window.renderQadaPrayersPage();
        const holder = window.document.createElement('div');
        holder.innerHTML = html;

        const qadaCards = holder.querySelectorAll('.card-grid .card');
        expect(qadaCards.length).toBe(2);
        expect(html).toContain(`${window.t('prayer_count')}: <strong>3</strong>`);
        expect(html).toContain(`${window.t('prayer_count')}: <strong>2</strong>`);
        expect(html).toContain("handleMakeUpQada('f3')");
        expect(html).toContain("handleMakeUpQada('i2')");
        expect(html).toContain("handleRemoveQada('f3')");
        expect(html).toContain("handleRemoveQada('i2')");

        cleanup();
    });

    it('makes up qada directly without confirmation dialog', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/prayer-service.js', 'js/pages/qada-prayers.js']
        });

        window.confirmDialog = vi.fn();
        window.PrayerService.makeUpQada = vi.fn(async () => ({ success: true }));
        window.updatePointsDisplay = vi.fn(async () => { });
        window.renderPage = vi.fn();
        window.showToast = vi.fn();

        await window.handleMakeUpQada('q-direct');

        expect(window.confirmDialog).not.toHaveBeenCalled();
        expect(window.PrayerService.makeUpQada).toHaveBeenCalledWith('q-direct');
        expect(window.updatePointsDisplay).toHaveBeenCalled();
        expect(window.renderPage).toHaveBeenCalledWith('qada-prayers', true);
        expect(window.showToast).toHaveBeenCalledWith(window.t('qada_made_up_message'), 'success');

        cleanup();
    });

    it('keeps qada remove action behind confirmation and deletes one record', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/prayer-service.js', 'js/pages/qada-prayers.js']
        });

        window.confirmDialog = vi.fn(async (_message, onConfirm) => {
            await onConfirm();
        });
        window.PrayerService.deleteQada = vi.fn(async () => ({ success: true }));
        window.renderPage = vi.fn();
        window.showToast = vi.fn();

        await window.handleRemoveQada('q-remove-one');
        await Promise.resolve();

        expect(window.confirmDialog).toHaveBeenCalledWith(window.t('confirm_delete'), expect.any(Function));
        expect(window.PrayerService.deleteQada).toHaveBeenCalledWith('q-remove-one');
        expect(window.renderPage).toHaveBeenCalledWith('qada-prayers', true);

        cleanup();
    });

    it('renders daily prayers page with cards', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/prayer-service.js',
                'components/prayer-card.js',
                'js/pages/daily-prayers.js'
            ]
        });

        window.PrayerService.getDailyPrayers = async () => ({});
        window.PrayerService.getDefinitions = () => ({
            fajr: { nameKey: 'fajr', rakaat: 2, points: 5, required: true },
            dhuhr: { nameKey: 'dhuhr', rakaat: 4, points: 5, required: true }
        });
        window.selectedDate = window.getCurrentDate();
        globalThis.selectedDate = window.selectedDate;
        window.PrayerManager = {
            async getPrayerTimesForToday() {
                return {
                    fajr: '05:00',
                    dhuhr: '12:30'
                };
            }
        };

        const html = await window.renderDailyPrayersPage();
        expect(html).toContain('prayer-card');

        cleanup();
    });

    it('renders habits page', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/habit-service.js',
                'components/habit-card.js',
                'js/pages/habits.js'
            ]
        });

        window.HabitService.getHabitsWithMeta = async () => ({
            habits: [{ id: 'h1', name: 'Duha', type: 'worship' }],
            meta: { statusByHabitId: {}, streakByHabitId: { h1: 2 } }
        });
        window.selectedDate = window.getCurrentDate();
        globalThis.selectedDate = window.selectedDate;

        const html = await window.renderHabitsPage();
        expect(html).toContain('page-title');
        expect(html).toContain('Duha');

        cleanup();
    });

    it('renders statistics page with chart output', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'components/charts.js',
                'js/points-manager.js',
                'js/data-manager.js',
                'js/pages/statistics.js'
            ]
        });

        window.getStatistics = async () => ({
            prayersPerformed: 5,
            prayersMissed: 1,
            totalRakaat: 18,
            worshipCount: 3,
            daysWithoutSin: 2,
            totalPoints: 80,
            rawPrayers: [{ date: window.getCurrentDate(), status: 'done' }]
        });

        const html = await window.renderStatisticsPage();
        expect(html).toContain('chart-container');
        expect(html).toContain('chart-container');

        cleanup();
    });

    it('renders settings page with account blocks', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/settings-service.js',
                'js/prayer-manager.js',
                'js/ui-helpers.js',
                'js/pages/settings.js'
            ]
        });

        window.AuthManager.getCurrentUser = async () => ({
            id: 'test-user-id',
            email: 'test@salatk.local',
            created_at: new Date().toISOString(),
            user_metadata: { username: 'tester' }
        });
        window.AuthManager.getProfile = async () => ({
            id: 'test-user-id',
            full_name: 'Tester',
            referral_code: 'ABC123',
            is_public: true
        });

        const html = await window.renderSettingsPage();
        expect(html).toContain('calcMethodSelect');
        expect(html).toContain('ABC123');

        cleanup();
    });

    it('renders leaderboard page from supabase rows', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/points-manager.js', 'js/pages/leaderboard.js']
        });

        window.supabaseClient.auth.getSession = async () => ({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
        });
        window.supabaseClient.from = () => ({
            select: () => ({
                order: () => ({
                    order: () => ({
                        limit: async () => ({
                            data: [
                                { user_id: 'test-user-id', full_name: 'Tester', total_points: 99 }
                            ],
                            error: null
                        })
                    })
                })
            })
        });

        const html = await window.renderLeaderboardPage();
        expect(html).toContain('leaderboard-table');
        expect(html).toContain('Tester');

        cleanup();
    });

    it('renders store page and owned theme controls', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/settings-service.js',
                'js/services/points-service.js',
                'js/pages/store.js'
            ]
        });

        window.SettingsService.getSettings = async () => ({ theme: 'light', language: 'ar' });
        window.PointsService.getTotal = async () => 200;
        window.AuthManager.getSession = async () => ({ user: { id: 'test-user-id' } });
        window.supabaseClient.from = () => ({
            select: () => ({
                eq: async () => ({ data: [{ theme_id: 'dark' }], error: null })
            })
        });

        const html = await window.renderStorePage();
        expect(html).toContain('theme-card');
        expect(html).toContain('theme-card');

        cleanup();
    });

    it('renders athkar page', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/pages/athkar.js']
        });

        const html = await window.renderAthkarPage();
        expect(html).toContain('athkar-card');

        cleanup();
    });

    it('renders more page and shows admin entry only for admins', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/pages/more.js']
        });

        window.AuthManager = {
            async isAdmin() {
                return false;
            }
        };

        const moreForUser = await window.renderMorePage();
        expect(moreForUser).toContain('more-grid');
        expect(moreForUser).not.toContain("navigateTo('admin')");

        window.getVisibleMainNavPages = () => ['statistics', 'store'];
        const moreCustomized = await window.renderMorePage();
        expect(moreCustomized).not.toContain("navigateTo('statistics')");
        expect(moreCustomized).not.toContain("navigateTo('store')");
        expect(moreCustomized).toContain("navigateTo('athkar')");

        window.AuthManager.isAdmin = async () => true;
        const moreForAdmin = await window.renderMorePage();
        expect(moreForAdmin).toContain("navigateTo('admin')");
        expect(moreForAdmin).toContain(window.t('nav_admin'));

        cleanup();
    });

    it('renders auth page', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/pages/auth.js']
        });

        const auth = window.renderAuthPage('login');
        expect(auth).toContain('auth-container');

        cleanup();
    });
});
