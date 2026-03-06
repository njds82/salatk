import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupPerformanceHarness() {
    const session = {
        user: {
            id: 'test-user-id',
            email: 'test@salatk.local'
        }
    };

    const { window, cleanup } = createBootstrappedWindow({
        loadCoreScripts: false
    });

    window.document.body.innerHTML = `
        <a href="#daily-prayers" class="nav-item" data-page="daily-prayers"></a>
        <a href="#settings" class="nav-item" data-page="settings"></a>
        <a href="#more" class="nav-item" data-page="more"></a>
        <div id="pageContent"></div>
        <button id="themeToggle"></button>
        <button id="langToggle"><span class="lang-text">EN</span></button>
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
        'js/services/page-data-cache.js'
    ]);

    window.AuthManager = {
        _session: session,
        async getSession() {
            return this._session;
        },
        setSession(next) {
            this._session = next;
        }
    };

    window.renderAuthPage = () => '<div>auth</div>';
    window.renderDailyPrayersPage = async () => '<div id="daily-ready">daily</div>';
    window.renderQadaPrayersPage = async () => '<div>qada</div>';
    window.renderHabitsPage = async () => '<div>habits</div>';
    window.renderDailyTasksPage = async () => '<div>tasks</div>';
    window.renderStatisticsPage = async () => '<div>stats</div>';
    window.renderLeaderboardPage = async () => '<div>leaderboard</div>';
    window.renderStorePage = async () => '<div>store</div>';
    window.renderAthkarPage = async () => '<div>athkar</div>';
    window.renderMorePage = async () => '<div>more</div>';
    window.setupAuthFormListeners = () => { };

    loadLegacyScripts(window, ['js/app.js']);

    return { window, cleanup };
}

describe('Navigation performance behavior', () => {
    it('shows skeleton immediately for heavy pages before data resolves', async () => {
        const { window, cleanup } = setupPerformanceHarness();

        window.renderSettingsPage = async () => {
            await sleep(40);
            return '<div id="settings-ready">settings-v1</div>';
        };

        window.navigateTo('settings');
        const content = window.document.getElementById('pageContent');

        expect(content.querySelector('.page-skeleton')).toBeTruthy();

        await sleep(140);
        expect(content.innerHTML).toContain('settings-v1');

        cleanup();
    });

    it('renders cached heavy page instantly then revalidates in background', async () => {
        const { window, cleanup } = setupPerformanceHarness();
        const content = window.document.getElementById('pageContent');

        window.renderSettingsPage = async () => {
            await sleep(35);
            return '<div id="settings-ready">settings-v1</div>';
        };

        window.navigateTo('settings');
        await sleep(80);
        expect(content.innerHTML).toContain('settings-v1');

        window.renderSettingsPage = async () => {
            await sleep(35);
            return '<div id="settings-ready">settings-v2</div>';
        };

        window.navigateTo('daily-prayers');
        await sleep(10);
        window.navigateTo('settings');

        expect(content.innerHTML).toContain('settings-v1');
        await sleep(55);
        expect(content.innerHTML).toContain('settings-v2');

        cleanup();
    });

    it('treats noScroll refresh as forceFresh and updates cache with fresh HTML', async () => {
        const { window, cleanup } = setupPerformanceHarness();
        const content = window.document.getElementById('pageContent');

        window.renderSettingsPage = async () => {
            await sleep(20);
            return '<div id="settings-ready">settings-v1</div>';
        };

        window.navigateTo('settings');
        await sleep(120);
        expect(content.innerHTML).toContain('settings-v1');

        window.renderSettingsPage = async () => {
            await sleep(20);
            return '<div id="settings-ready">settings-v2</div>';
        };

        await window.renderPage('settings', true);
        expect(content.innerHTML).toContain('settings-v2');

        cleanup();
    });
});
