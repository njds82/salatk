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
        window.setupAuthFormListeners = () => { };

        return { window, cleanup };
    }

    async function waitForRender() {
        await new Promise(resolve => setTimeout(resolve, 0));
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
});
