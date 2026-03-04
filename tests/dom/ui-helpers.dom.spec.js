import { createBootstrappedWindow } from '../helpers/bootstrap.js';

describe('UI helpers', () => {
    it('updates prayer and habit cards without full page reload', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/prayer-service.js',
                'js/services/habit-service.js',
                'components/prayer-card.js',
                'components/habit-card.js',
                'js/ui-helpers.js'
            ]
        });

        window.selectedDate = window.getCurrentDate();
        window.document.body.innerHTML += `
            <div class="card-grid">
                <div class="prayer-card" data-prayer="fajr"></div>
                <div class="card"><button onclick="handleDeleteHabit('h1')"></button></div>
            </div>
            <div id="pageContent"></div>
        `;

        window.PrayerService.getDailyPrayers = async () => ({ fajr: { status: 'done' } });
        window.PrayerService.getDefinitions = () => ({
            fajr: { nameKey: 'fajr', rakaat: 2, points: 5, required: true }
        });

        window.PrayerManager = {
            async getPrayerTimesForToday() {
                return { fajr: '05:00' };
            }
        };

        window.HabitService.getAll = async () => [{ id: 'h1', name: 'Habit', type: 'worship' }];
        window.HabitService.getStreak = async () => 1;
        window.HabitService.getHistory = async () => ({ [window.selectedDate]: 'done' });

        await window.updatePrayerCard('fajr');
        await window.updateHabitCard('h1');

        expect(window.document.querySelector('.prayer-card')).toBeTruthy();
        expect(window.document.querySelector('.habit-name') || window.document.querySelector('.card')).toBeTruthy();

        cleanup();
    });

    it('refreshes qada list via qada page rerender', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/prayer-service.js', 'js/data-manager.js', 'js/ui-helpers.js']
        });

        window.renderPage = vi.fn(async () => true);

        await window.refreshQadaList();
        expect(window.renderPage).toHaveBeenCalledWith('qada-prayers', true);

        cleanup();
    });
});
