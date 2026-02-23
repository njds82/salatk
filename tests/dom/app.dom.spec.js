import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';

describe('App controller', () => {
    it('navigates and updates current page/hash', async () => {
        const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });

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

        window.AuthManager = {
            _session: null,
            async getSession() {
                return null;
            }
        };

        window.navigateTo('login');
        expect(window.location.hash).toBe('#login');

        cleanup();
    });
});
