import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { createMockSupabaseClient } from '../helpers/mock-supabase.js';

const DEFAULT_SESSION = {
    user: {
        id: 'test-user-id',
        email: 'test@salatk.local'
    }
};

describe('PageDataCache performance behavior', () => {
    it('supports TTL and event-driven invalidation', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/page-data-cache.js']
        });

        window.PageDataCache.clear();
        window.PageDataCache.set('settings', {}, '<div>cached</div>', 20);
        expect(window.PageDataCache.get('settings', {})?.html).toContain('cached');

        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(window.PageDataCache.get('settings', {})).toBeNull();

        window.PageDataCache.set('settings', {}, '<div>cached</div>');
        window.dispatchEvent(new window.CustomEvent('languageChanged', { detail: { language: 'en' } }));
        expect(window.PageDataCache.get('settings', {})).toBeNull();

        window.PageDataCache.set('statistics', {}, '<div>stats</div>');
        window.PageDataCache.set('habits', {}, '<div>habits</div>');
        window.dispatchEvent(new window.CustomEvent('pointsUpdated', { detail: { totalPoints: 7 } }));
        expect(window.PageDataCache.get('statistics', {})).toBeNull();
        expect(window.PageDataCache.get('habits', {})?.html).toContain('habits');

        window.dispatchEvent(new window.CustomEvent('authSessionChanged', {
            detail: { previousUserId: 'test-user-id', nextUserId: null }
        }));
        expect(window.PageDataCache.get('habits', {})).toBeNull();

        cleanup();
    });
});

describe('PointsService total cache behavior', () => {
    it('uses cache for repeated totals and respects force refresh/invalidation', async () => {
        const client = createMockSupabaseClient({
            tables: {
                leaderboard: [{ user_id: 'test-user-id', total_points: 42 }],
                points_history: []
            },
            session: DEFAULT_SESSION
        });

        let leaderboardReadCount = 0;
        const originalFrom = client.from.bind(client);
        client.from = (table) => {
            const query = originalFrom(table);
            if (table === 'leaderboard') {
                const originalSelect = query.select.bind(query);
                query.select = (...args) => {
                    leaderboardReadCount += 1;
                    return originalSelect(...args);
                };
            }
            return query;
        };

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                _session: DEFAULT_SESSION,
                async getSession() { return this._session; },
                setSession(session) { this._session = session; }
            },
            scripts: ['js/services/points-service.js']
        });

        expect(await window.PointsService.getTotal()).toBe(42);
        expect(await window.PointsService.getTotal()).toBe(42);
        expect(leaderboardReadCount).toBe(1);

        expect(await window.PointsService.getTotal({ forceRefresh: true })).toBe(42);
        expect(leaderboardReadCount).toBe(2);

        window.PointsService.invalidateTotalCache('test-user-id');
        expect(await window.PointsService.getTotal()).toBe(42);
        expect(leaderboardReadCount).toBe(3);

        await window.PointsService.addPoints(1, 'cache-test', 'cache-test-point');
        expect(leaderboardReadCount).toBe(4);

        await window.PointsService.getTotal();
        expect(leaderboardReadCount).toBe(4);

        cleanup();
    });
});

describe('Statistics side effects', () => {
    it('does not call updatePointsDisplay inside getStatistics', async () => {
        const client = createMockSupabaseClient({
            tables: {
                prayer_records: [
                    { user_id: 'test-user-id', date: '2026-02-23', prayer_key: 'fajr', status: 'done' },
                    { user_id: 'test-user-id', date: '2026-02-23', prayer_key: 'isha', status: 'missed' }
                ],
                habit_history: [
                    { user_id: 'test-user-id', action: 'done' },
                    { user_id: 'test-user-id', action: 'avoided' }
                ],
                leaderboard: [{ user_id: 'test-user-id', total_points: 13 }],
                points_history: []
            },
            session: DEFAULT_SESSION
        });

        const { window, cleanup } = createBootstrappedWindow({
            supabaseClient: client,
            authManager: {
                _session: DEFAULT_SESSION,
                async getSession() { return this._session; },
                setSession(session) { this._session = session; }
            },
            scripts: ['js/services/points-service.js', 'js/data-manager.js']
        });

        window.updatePointsDisplay = vi.fn();
        const stats = await window.getStatistics();

        expect(stats.prayersPerformed).toBe(1);
        expect(stats.prayersMissed).toBe(1);
        expect(window.updatePointsDisplay).not.toHaveBeenCalled();

        cleanup();
    });
});
