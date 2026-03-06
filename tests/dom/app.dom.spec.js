import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';

describe('App controller', () => {
    function setupAppHarness(options = {}) {
        const { window, cleanup } = createBootstrappedWindow({
            loadCoreScripts: false,
            ...options
        });

        window.document.body.innerHTML = `
            <a href="#daily-prayers" class="nav-item" data-page="daily-prayers"></a>
            <a href="#more" class="nav-item" data-page="more"></a>
            <div id="pageContent"></div>
            <button id="themeToggle"></button>
            <button id="langToggle"></button>
            <button id="notifToggle"></button>
            <button id="closeNotif"></button>
            <button id="clearNotifs"></button>
            <button id="navMenuToggle"></button>
            <div id="navDrawerBackdrop"></div>
            <button id="navDrawerClose"></button>
            <nav id="mainNav"></nav>
            <div id="splashScreen"></div>
            <div id="splashQuote"></div>
        `;

        loadLegacyScripts(window, [
            'js/config.example.js',
            'js/i18n.js',
            'js/date-utils.js',
            'js/app.js'
        ]);

        window.renderAuthPage = () => '<div>auth</div>';
        window.renderDailyPrayersPage = async () => '<div>daily</div>';
        window.renderQadaPrayersPage = async () => '<div>qada</div>';
        window.renderHabitsPage = async () => '<div>habits</div>';
        window.renderDailyTasksPage = async () => '<div>tasks</div>';
        window.renderStatisticsPage = async () => '<div>stats</div>';
        window.renderLeaderboardPage = async () => '<div>board</div>';
        window.renderStorePage = async () => '<div>store</div>';
        window.renderSettingsPage = async () => '<div>settings</div>';
        window.renderAthkarPage = async () => '<div>athkar</div>';
        window.renderMorePage = async () => '<div>more</div>';
        window.renderAdminPage = async () => '<div>admin</div>';
        window.setupAuthFormListeners = () => { };

        return { window, cleanup };
    }

    async function waitForRender() {
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    function setupNavCustomizationHarness() {
        const { window, cleanup } = createBootstrappedWindow({
            loadCoreScripts: false
        });

        window.document.body.innerHTML = `
            <nav id="mainNav">
                <a href="#daily-prayers" class="nav-item" data-page="daily-prayers"></a>
                <a href="#qada-prayers" class="nav-item" data-page="qada-prayers"></a>
                <a href="#habits" class="nav-item" data-page="habits"></a>
                <a href="#leaderboard" class="nav-item" data-page="leaderboard"></a>
                <a href="#daily-tasks" class="nav-item" data-page="daily-tasks"></a>
                <a href="#time-management" class="nav-item" data-page="time-management"></a>
                <a href="#more" class="nav-item" data-page="more"></a>
            </nav>
            <div id="pageContent"></div>
            <button id="themeToggle"></button>
            <button id="langToggle"></button>
            <button id="notifToggle"></button>
            <button id="closeNotif"></button>
            <button id="clearNotifs"></button>
            <button id="navMenuToggle"></button>
            <div id="navDrawerBackdrop"></div>
            <button id="navDrawerClose"></button>
            <div id="splashScreen"></div>
            <div id="splashQuote"></div>
        `;

        loadLegacyScripts(window, [
            'js/config.example.js',
            'js/i18n.js',
            'js/date-utils.js',
            'js/app.js'
        ]);

        return { window, cleanup };
    }

    it('navigates and updates current page/hash', async () => {
        const { window, cleanup } = setupAppHarness();

        window.AuthManager = {
            _session: null,
            async getSession() {
                return null;
            }
        };

        window.navigateTo('login');
        await waitForRender();
        expect(window.location.hash).toBe('#login');

        cleanup();
    });

    it('navigates to default page when URL has no hash', async () => {
        const session = {
            user: {
                id: 'test-user-id',
                email: 'test@salatk.local'
            }
        };
        const { window, cleanup } = setupAppHarness({ url: 'http://localhost/' });

        window.AuthManager = {
            _session: session,
            async getSession() {
                return session;
            }
        };

        window.navigateToHash();
        await waitForRender();

        expect(window.location.hash).toBe('#daily-prayers');
        expect(window.currentPage).toBe('daily-prayers');
        expect(window.document.getElementById('pageContent').innerHTML).toContain('daily');

        cleanup();
    });

    it('falls back to default page when URL hash is invalid', async () => {
        const session = {
            user: {
                id: 'test-user-id',
                email: 'test@salatk.local'
            }
        };
        const { window, cleanup } = setupAppHarness({ url: 'http://localhost/#abc' });

        window.AuthManager = {
            _session: session,
            async getSession() {
                return session;
            }
        };

        window.navigateToHash();
        await waitForRender();

        expect(window.location.hash).toBe('#daily-prayers');
        expect(window.currentPage).toBe('daily-prayers');
        expect(window.document.getElementById('pageContent').innerHTML).toContain('daily');

        cleanup();
    });

    it('prevents non-admin users from opening admin page', async () => {
        const session = {
            user: {
                id: 'test-user-id',
                email: 'test@salatk.local'
            }
        };
        const { window, cleanup } = setupAppHarness({ url: 'http://localhost/#admin' });

        window.showToast = vi.fn();
        window.AuthManager = {
            _session: session,
            async getSession() {
                return session;
            },
            async getAccountStatus() {
                return { is_blocked: false };
            },
            async isAdmin() {
                return false;
            },
            async signOut() {
                return { error: null };
            }
        };

        window.navigateToHash();
        await waitForRender();
        await waitForRender();

        expect(window.location.hash).toBe('#daily-prayers');
        expect(window.currentPage).toBe('daily-prayers');
        expect(window.document.getElementById('pageContent').innerHTML).toContain('daily');
        expect(window.showToast).toHaveBeenCalledWith(window.t('error_admin_only'), 'error');

        cleanup();
    });

    it('signs out blocked users before rendering protected pages', async () => {
        const session = {
            user: {
                id: 'blocked-user-id',
                email: 'blocked@salatk.local'
            }
        };
        const { window, cleanup } = setupAppHarness();

        const signOut = vi.fn(async () => ({ error: null }));
        window.AuthManager = {
            _session: session,
            async getSession() {
                return session;
            },
            async getAccountStatus() {
                return { is_blocked: true, blocked_reason: 'test' };
            },
            async isAdmin() {
                return false;
            },
            signOut
        };
        window.showToast = vi.fn();
        window.renderSettingsPage = vi.fn(async () => '<div>settings</div>');

        window.navigateTo('settings');
        await waitForRender();
        await waitForRender();

        expect(signOut).toHaveBeenCalled();
        expect(window.showToast).toHaveBeenCalledWith(window.t('error_account_blocked'), 'error');
        expect(window.renderSettingsPage).not.toHaveBeenCalled();

        cleanup();
    });

    it('applies saved nav order/visibility preferences to main navigation', () => {
        const { window, cleanup } = setupNavCustomizationHarness();
        window.localStorage.setItem('salatk_nav_preferences_v1', JSON.stringify({
            order: ['more', 'daily-prayers', 'qada-prayers', 'habits', 'leaderboard', 'daily-tasks', 'time-management'],
            hidden: ['habits']
        }));

        window.applyNavigationPreferences();

        const pages = [...window.document.querySelectorAll('#mainNav .nav-item')]
            .map((item) => item.getAttribute('data-page'));
        expect(pages).toEqual([
            'more',
            'daily-prayers',
            'qada-prayers',
            'habits',
            'leaderboard',
            'daily-tasks',
            'time-management'
        ]);
        expect(window.document.querySelector('.nav-item[data-page="habits"]').classList.contains('nav-item-hidden')).toBe(true);
        expect(window.document.querySelector('.nav-item[data-page="daily-prayers"]').classList.contains('nav-item-hidden')).toBe(false);

        cleanup();
    });

    it('keeps locked pages visible and allows reset of nav customization', () => {
        const { window, cleanup } = setupNavCustomizationHarness();

        expect(window.toggleNavPageVisibility('daily-prayers')).toBe(false);
        expect(window.toggleNavPageVisibility('more')).toBe(false);
        expect(window.toggleNavPageVisibility('qada-prayers')).toBe(true);

        let state = window.getNavCustomizationState();
        expect(state.items.find(item => item.id === 'qada-prayers').visible).toBe(false);

        expect(window.moveNavPage('more', -1)).toBe(true);
        state = window.getNavCustomizationState();
        expect(state.items[5].id).toBe('more');

        window.resetNavCustomization();
        state = window.getNavCustomizationState();
        expect(state.items.map(item => item.id)).toEqual([
            'daily-prayers',
            'qada-prayers',
            'habits',
            'leaderboard',
            'daily-tasks',
            'time-management',
            'more'
        ]);
        expect(state.items.every(item => item.visible)).toBe(true);

        cleanup();
    });
});
