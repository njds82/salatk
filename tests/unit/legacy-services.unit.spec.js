import { createBootstrappedWindow } from '../helpers/bootstrap.js';

describe('Migration and Data Manager', () => {
    it('migration service exits safely when already initialized', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/db.js', 'js/services/migration-service.js']
        });

        window.db.settings.count = async () => 1;
        await expect(window.MigrationService.checkAndMigrate()).resolves.toBeUndefined();

        cleanup();
    });

    it('data manager computes statistics shape', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/points-service.js',
                'js/data-manager.js'
            ]
        });

        window.PointsService.getTotal = async () => 5;
        window.supabaseClient.from = (table) => ({
            select: () => ({
                eq: async () => {
                    if (table === 'prayer_records') {
                        return {
                            data: [
                                { prayer_key: 'fajr', status: 'done' },
                                { prayer_key: 'dhuhr', status: 'missed' }
                            ],
                            error: null
                        };
                    }
                    if (table === 'habit_history') {
                        return {
                            data: [{ action: 'done' }, { action: 'avoided' }],
                            error: null
                        };
                    }
                    return { data: [], error: null };
                }
            })
        });

        const stats = await window.getStatistics();
        expect(stats).toEqual(expect.objectContaining({
            prayersPerformed: 1,
            prayersMissed: 1,
            totalPoints: 5
        }));

        cleanup();
    });
});
