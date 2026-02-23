import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { createMockSupabaseClient } from '../helpers/mock-supabase.js';

const DEFAULT_SESSION = {
    user: {
        id: 'test-user-id',
        email: 'test@salatk.local'
    }
};

function createAuthManager(session = DEFAULT_SESSION) {
    return {
        _session: session,
        async getSession() {
            return this._session;
        },
        setSession(next) {
            this._session = next;
        },
        async getCurrentUser() {
            return this._session ? this._session.user : null;
        },
        async getProfile() {
            return this._session
                ? { id: this._session.user.id, full_name: 'Tester', username: 'tester' }
                : null;
        }
    };
}

function setupServiceWindow({ scripts, tables = {}, session = DEFAULT_SESSION, authManager, supabaseClient } = {}) {
    const client = supabaseClient || createMockSupabaseClient({ tables, session });

    const boot = createBootstrappedWindow({
        supabaseClient: client,
        authManager: authManager || createAuthManager(session),
        scripts
    });

    return {
        ...boot,
        client
    };
}

function installTableError(window, tableName, patchQuery) {
    const originalFrom = window.supabaseClient.from.bind(window.supabaseClient);
    window.supabaseClient.from = (table) => {
        const query = originalFrom(table);
        if (table === tableName) {
            return patchQuery(query);
        }
        return query;
    };
}

describe('Points Service Critical Coverage', () => {
    it('covers totals, fallbacks, history and add/remove edge paths', async () => {
        const { window, cleanup } = setupServiceWindow({
            scripts: ['js/services/points-service.js'],
            tables: {
                leaderboard: [{ user_id: 'test-user-id', total_points: 7 }],
                points_history: [
                    { id: 'p1', user_id: 'test-user-id', amount: 2, reason: 'a', recorded_at: '2026-02-20T00:00:00.000Z' },
                    { id: 'p2', user_id: 'test-user-id', amount: 3, reason: 'b', recorded_at: '2026-02-21T00:00:00.000Z' }
                ]
            }
        });

        // no client
        const originalClient = window.supabaseClient;
        window.supabaseClient = null;
        expect(await window.PointsService.getTotal()).toBe(0);
        expect(await window.PointsService.getHistory()).toEqual([]);
        expect(await window.PointsService.addPoints(1, 'x')).toBe(false);
        window.supabaseClient = originalClient;

        // no session
        window.AuthManager.setSession(null);
        expect(await window.PointsService.getTotal()).toBe(0);
        expect(await window.PointsService.getHistory()).toEqual([]);
        expect(await window.PointsService.addPoints(1, 'x')).toBe(false);

        // happy path total from leaderboard
        window.AuthManager.setSession(DEFAULT_SESSION);
        expect(await window.PointsService.getTotal()).toBe(7);

        // history mapping
        const history = await window.PointsService.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0]).toEqual(expect.objectContaining({ id: 'p2', amount: 3, reason: 'b' }));

        // fallback path from manual sum (leaderboard error)
        installTableError(window, 'leaderboard', (query) => ({
            ...query,
            select() {
                return {
                    eq() {
                        return {
                            maybeSingle: async () => ({ data: null, error: { message: 'view-failed' } })
                        };
                    }
                };
            }
        }));
        expect(await window.PointsService.getTotal({ forceRefresh: true })).toBe(5);

        // fallback fetch failure -> 0
        installTableError(window, 'points_history', (query) => ({
            ...query,
            select() {
                return {
                    eq() {
                        return {
                            limit: async () => ({ data: null, error: { message: 'fallback-failed' } }),
                            order: async () => ({ data: null, error: { message: 'history-failed' } })
                        };
                    }
                };
            }
        }));
        expect(await window.PointsService.getTotal({ forceRefresh: true })).toBe(0);
        expect(await window.PointsService.getHistory()).toEqual([]);

        // getTotal catch branch
        window.supabaseClient.from = () => ({
            select() {
                throw new Error('boom');
            }
        });
        expect(await window.PointsService.getTotal({ forceRefresh: true })).toBe(5);

        // restore client
        window.supabaseClient = createMockSupabaseClient({
            tables: {
                leaderboard: [{ user_id: 'test-user-id', total_points: 11 }],
                points_history: [{ id: 'delete-me', user_id: 'test-user-id', amount: 5, reason: 'x', recorded_at: new Date().toISOString() }]
            },
            session: DEFAULT_SESSION
        });

        // delete by id path (amount=0 and provided id)
        expect(await window.PointsService.addPoints(0, 'reset', 'delete-me')).toBe(true);

        // delete path with error
        installTableError(window, 'points_history', (query) => ({
            ...query,
            delete() {
                return {
                    eq: async () => ({ error: { message: 'delete-failed' } })
                };
            }
        }));
        expect(await window.PointsService.addPoints(0, 'reset', 'missing')).toBe(false);

        // upsert error path
        installTableError(window, 'points_history', (query) => ({
            ...query,
            upsert: async () => ({ error: { message: 'upsert-failed' } })
        }));
        expect(await window.PointsService.addPoints(2, 'will-fail', 'id-fail')).toBe(false);

        // success path + event dispatch
        window.supabaseClient = createMockSupabaseClient({
            tables: {
                leaderboard: [{ user_id: 'test-user-id', total_points: 13 }],
                points_history: []
            },
            session: DEFAULT_SESSION
        });

        const observedTotals = [];
        window.addEventListener('pointsUpdated', (event) => {
            observedTotals.push(event.detail.totalPoints);
        });

        expect(await window.PointsService.addPoints(6, 'ok', 'id-ok')).toBe(true);
        expect(observedTotals.at(-1)).toBe(13);

        // addPoints catch branch
        window.supabaseClient.from = () => {
            throw new Error('from-crash');
        };
        expect(await window.PointsService.addPoints(1, 'boom', 'id-boom')).toBe(false);

        // dedupe stub
        await expect(window.PointsService.deduplicatePoints()).resolves.toBeUndefined();

        cleanup();
    });
});

describe('Prayer Service Critical Coverage', () => {
    it('covers definitions, read paths and markPrayer branches', async () => {
        const { window, cleanup } = setupServiceWindow({
            scripts: ['js/services/points-service.js', 'js/services/prayer-service.js'],
            tables: {
                prayer_records: [
                    { user_id: 'test-user-id', date: '2026-02-23', prayer_key: 'fajr', status: 'done', recorded_at: '2026-02-23T00:00:00.000Z' }
                ],
                qada_prayers: [],
                points_history: [],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }]
            }
        });

        expect(window.PrayerService.getDefinitions()).toHaveProperty('fajr');

        // getDailyPrayers: no client / no session / success / error
        const cachedClient = window.supabaseClient;
        window.supabaseClient = null;
        expect(await window.PrayerService.getDailyPrayers('2026-02-23')).toEqual({});
        window.supabaseClient = cachedClient;

        window.AuthManager.setSession(null);
        expect(await window.PrayerService.getDailyPrayers('2026-02-23')).toEqual({});
        window.AuthManager.setSession(DEFAULT_SESSION);

        const mapped = await window.PrayerService.getDailyPrayers('2026-02-23');
        expect(mapped.fajr).toEqual(expect.objectContaining({ key: 'fajr', status: 'done' }));

        const originalWithTimeout = window.withTimeout;
        window.withTimeout = async () => ({ data: null, error: { message: 'read-failed' } });
        expect(await window.PrayerService.getDailyPrayers('2026-02-23')).toEqual({});
        window.withTimeout = originalWithTimeout;

        // markPrayer parameter/session guards
        expect(await window.PrayerService.markPrayer('', '2026-02-23', 'done')).toEqual({ success: false });
        window.AuthManager.setSession(null);
        expect(await window.PrayerService.markPrayer('fajr', '2026-02-23', 'done')).toEqual({ success: false });
        window.AuthManager.setSession(DEFAULT_SESSION);

        // markPrayer missed path with failed qada
        const qadaFailSpy = vi.spyOn(window.PrayerService, 'addQada').mockResolvedValue({ success: false });
        expect(await window.PrayerService.markPrayer('fajr', '2026-02-23', 'missed')).toEqual({ success: false });
        qadaFailSpy.mockRestore();

        // markPrayer skip branch (same status)
        expect(await window.PrayerService.markPrayer('fajr', '2026-02-23', 'done')).toEqual({ success: true });

        // markPrayer done path + removeQada + points
        const removeQadaSpy = vi.spyOn(window.PrayerService, 'removeQada').mockResolvedValue({ success: true });
        const addPointsSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);
        expect(await window.PrayerService.markPrayer('dhuhr', '2026-02-23', 'done')).toEqual({ success: true });
        expect(removeQadaSpy).toHaveBeenCalled();
        expect(addPointsSpy).toHaveBeenCalledWith(5, expect.any(String), 'test-user-id:prayer:2026-02-23:dhuhr');

        // markPrayer "other status" branch uses removeQada and 0 points
        expect(await window.PrayerService.markPrayer('asr', '2026-02-23', 'skipped')).toEqual({ success: true });

        // markPrayer catch branch on upsert error
        const originalFrom = window.supabaseClient.from.bind(window.supabaseClient);
        window.supabaseClient.from = (table) => {
            const query = originalFrom(table);
            if (table === 'prayer_records') {
                return {
                    ...query,
                    upsert: async () => ({ error: { message: 'write-failed' } })
                };
            }
            return query;
        };
        const failedMark = await window.PrayerService.markPrayer('maghrib', '2026-02-23', 'done');
        expect(failedMark.success).toBe(false);

        removeQadaSpy.mockRestore();
        addPointsSpy.mockRestore();
        cleanup();
    });

    it('covers qada CRUD, cleanup and streak branches', async () => {
        const today = '2026-02-23';
        const yesterday = '2026-02-22';
        const older = '2026-02-20';

        const { window, cleanup } = setupServiceWindow({
            scripts: ['js/services/points-service.js', 'js/services/prayer-service.js'],
            tables: {
                prayer_records: [
                    { user_id: 'test-user-id', date: yesterday, prayer_key: 'fajr', status: 'done', recorded_at: new Date().toISOString() },
                    { user_id: 'test-user-id', date: older, prayer_key: 'fajr', status: 'missed', recorded_at: new Date().toISOString() }
                ],
                qada_prayers: [
                    { id: 'q1', user_id: 'test-user-id', original_date: yesterday, prayer_key: 'fajr', rakaat: 2, is_manual: false, recorded_at: new Date().toISOString() },
                    { id: 'q2', user_id: 'test-user-id', original_date: null, prayer_key: 'isha', rakaat: 4, is_manual: false, recorded_at: new Date().toISOString() }
                ],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }],
                points_history: []
            }
        });

        // addQada wrapper + addMultiple branches
        expect((await window.PrayerService.addQada('2026-02-21', 'fajr', 2)).success).toBe(true);
        expect((await window.PrayerService.addMultipleQada('2026-02-21', 'fajr', 2, 0)).success).toBe(false);

        window.AuthManager.setSession(null);
        expect((await window.PrayerService.addMultipleQada('2026-02-21', 'fajr', 2, 1)).success).toBe(false);
        window.AuthManager.setSession(DEFAULT_SESSION);

        expect((await window.PrayerService.addMultipleQada(null, 'isha', 4, 2, true)).success).toBe(true);

        // addMultiple error on upsert/insert
        const originalFrom = window.supabaseClient.from.bind(window.supabaseClient);
        window.supabaseClient.from = (table) => {
            const query = originalFrom(table);
            if (table === 'qada_prayers') {
                return {
                    ...query,
                    upsert: async () => ({ error: { message: 'upsert-failed' } }),
                    insert: async () => ({ error: { message: 'insert-failed' } })
                };
            }
            return query;
        };
        expect((await window.PrayerService.addMultipleQada('2026-02-19', 'fajr', 2, 1)).success).toBe(false);
        expect((await window.PrayerService.addMultipleQada(null, 'fajr', 2, 1)).success).toBe(false);

        // getQadaPrayers no client/no session/success/error
        const liveClient = window.supabaseClient;
        window.supabaseClient = null;
        expect(await window.PrayerService.getQadaPrayers()).toEqual([]);
        window.supabaseClient = liveClient;

        window.AuthManager.setSession(null);
        expect(await window.PrayerService.getQadaPrayers()).toEqual([]);
        window.AuthManager.setSession(DEFAULT_SESSION);

        const qadaList = await window.PrayerService.getQadaPrayers();
        expect(qadaList.length).toBeGreaterThan(0);

        window.supabaseClient.from = () => ({
            select: () => ({
                eq: () => ({
                    order: async () => ({ data: null, error: { message: 'qada-read-failed' } })
                })
            })
        });
        expect(await window.PrayerService.getQadaPrayers()).toEqual([]);

        // makeUpQada no client / fetchError / deleteError / success + session-null pointId
        window.supabaseClient = null;
        expect(await window.PrayerService.makeUpQada('q-any')).toEqual({ success: false });

        window.supabaseClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [{ id: 'q-fetch', user_id: 'test-user-id', original_date: null, prayer_key: 'fajr', rakaat: 2, is_manual: false, recorded_at: new Date().toISOString() }],
                prayer_records: [],
                points_history: [],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }]
            },
            session: DEFAULT_SESSION
        });

        window.supabaseClient.from = () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: { message: 'missing' } })
                })
            })
        });
        expect(await window.PrayerService.makeUpQada('q-fetch')).toEqual({ success: false });

        window.supabaseClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [{ id: 'q-del', user_id: 'test-user-id', original_date: '2026-02-19', prayer_key: 'fajr', rakaat: 2, is_manual: false, recorded_at: new Date().toISOString() }],
                prayer_records: [],
                points_history: [],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }]
            },
            session: DEFAULT_SESSION
        });
        const makeOriginalFrom = window.supabaseClient.from.bind(window.supabaseClient);
        window.supabaseClient.from = (table) => {
            const query = makeOriginalFrom(table);
            if (table === 'qada_prayers') {
                return {
                    ...query,
                    delete: () => ({
                        eq: async () => ({ error: { message: 'delete-failed' } })
                    })
                };
            }
            return query;
        };
        expect(await window.PrayerService.makeUpQada('q-del')).toEqual({ success: false });

        // success path with session missing (point id fallback)
        const successClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [{ id: 'q-ok', user_id: 'test-user-id', original_date: null, prayer_key: 'fajr', rakaat: 2, is_manual: false, recorded_at: new Date().toISOString() }],
                prayer_records: [],
                points_history: [],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }]
            },
            session: DEFAULT_SESSION
        });
        window.supabaseClient = successClient;
        const pointSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);
        window.AuthManager.setSession(null);
        expect(await window.PrayerService.makeUpQada('q-ok')).toEqual({ success: true });
        expect(pointSpy).toHaveBeenCalledWith(3, expect.any(String), 'qada:q-ok');
        pointSpy.mockRestore();

        // deleteQada branches
        window.supabaseClient = null;
        expect(await window.PrayerService.deleteQada('x')).toEqual({ success: false });

        window.supabaseClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [{ id: 'q-del-ok', user_id: 'test-user-id', original_date: null, prayer_key: 'isha', rakaat: 4, is_manual: false, recorded_at: new Date().toISOString() }]
            },
            session: DEFAULT_SESSION
        });
        expect(await window.PrayerService.deleteQada('q-del-ok')).toEqual({ success: true });

        window.supabaseClient.from = () => ({
            delete: () => ({
                eq: async () => ({ error: { message: 'delete-failed' } })
            })
        });
        expect(await window.PrayerService.deleteQada('q-del-ok')).toEqual({ success: false });

        // removeQada branches
        window.supabaseClient = null;
        expect(await window.PrayerService.removeQada('2026-02-22', 'fajr')).toEqual({ success: false });

        window.supabaseClient = createMockSupabaseClient({ tables: { qada_prayers: [] }, session: DEFAULT_SESSION });
        window.AuthManager.setSession(null);
        expect(await window.PrayerService.removeQada('2026-02-22', 'fajr')).toEqual({ success: false });
        window.AuthManager.setSession(DEFAULT_SESSION);
        expect(await window.PrayerService.removeQada('2026-02-22', 'fajr')).toEqual({ success: true });

        window.supabaseClient.from = () => ({
            delete: () => ({
                eq: () => ({
                    eq: () => ({
                        eq: async () => ({ error: { message: 'remove-failed' } })
                    })
                })
            })
        });
        expect(await window.PrayerService.removeQada('2026-02-22', 'fajr')).toEqual({ success: false });

        // resetPrayer branches
        window.supabaseClient = null;
        expect(await window.PrayerService.resetPrayer('fajr', today)).toEqual({ success: false });

        window.supabaseClient = createMockSupabaseClient({ tables: { prayer_records: [], qada_prayers: [], points_history: [] }, session: DEFAULT_SESSION });
        window.AuthManager.setSession(null);
        expect(await window.PrayerService.resetPrayer('fajr', today)).toEqual({ success: false });

        window.AuthManager.setSession(DEFAULT_SESSION);
        const pointsResetSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);
        expect(await window.PrayerService.resetPrayer('fajr', today)).toEqual({ success: true });
        pointsResetSpy.mockRestore();

        window.supabaseClient.from = () => ({
            delete: () => ({
                eq: () => ({
                    eq: () => ({
                        eq: async () => {
                            throw new Error('delete-crash');
                        }
                    })
                })
            })
        });
        expect(await window.PrayerService.resetPrayer('fajr', today)).toEqual({ success: false });

        // cleanupQada branches
        window.supabaseClient = null;
        await expect(window.PrayerService.cleanupQada()).resolves.toBeUndefined();

        window.supabaseClient = createMockSupabaseClient({ tables: { qada_prayers: [] }, session: DEFAULT_SESSION });
        window.AuthManager.setSession(null);
        await expect(window.PrayerService.cleanupQada()).resolves.toBeUndefined();

        // no qadas
        window.AuthManager.setSession(DEFAULT_SESSION);
        await expect(window.PrayerService.cleanupQada()).resolves.toBeUndefined();

        // uniqueDates empty
        window.supabaseClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [{ id: 'q-null-date', user_id: 'test-user-id', original_date: null, prayer_key: 'fajr', is_manual: false, recorded_at: new Date().toISOString() }],
                prayer_records: []
            },
            session: DEFAULT_SESSION
        });
        await expect(window.PrayerService.cleanupQada()).resolves.toBeUndefined();

        // idsToDelete > 0 and = 0
        window.supabaseClient = createMockSupabaseClient({
            tables: {
                qada_prayers: [
                    { id: 'q-rm', user_id: 'test-user-id', original_date: yesterday, prayer_key: 'fajr', is_manual: false, recorded_at: new Date().toISOString() },
                    { id: 'q-keep', user_id: 'test-user-id', original_date: older, prayer_key: 'isha', is_manual: false, recorded_at: new Date().toISOString() }
                ],
                prayer_records: [
                    { user_id: 'test-user-id', date: yesterday, prayer_key: 'fajr', status: 'done', recorded_at: new Date().toISOString() }
                ]
            },
            session: DEFAULT_SESSION
        });
        await window.PrayerService.cleanupQada();
        expect(window.supabaseClient.__tables.qada_prayers.find((q) => q.id === 'q-rm')).toBeUndefined();
        expect(window.supabaseClient.__tables.qada_prayers.find((q) => q.id === 'q-keep')).toBeDefined();

        // cleanup catch branch
        window.supabaseClient.from = () => {
            throw new Error('cleanup-crash');
        };
        await expect(window.PrayerService.cleanupQada()).resolves.toBeUndefined();

        // getPrayerStreak branches
        window.supabaseClient = null;
        expect(await window.PrayerService.getPrayerStreak()).toBe(0);

        window.supabaseClient = createMockSupabaseClient({ tables: { prayer_records: [] }, session: DEFAULT_SESSION });
        window.AuthManager.setSession(null);
        expect(await window.PrayerService.getPrayerStreak()).toBe(0);

        window.AuthManager.setSession(DEFAULT_SESSION);
        window.supabaseClient.from = () => ({
            select: () => ({
                eq: () => ({
                    order: async () => ({ data: null, error: { message: 'streak-failed' } })
                })
            })
        });
        expect(await window.PrayerService.getPrayerStreak()).toBe(0);

        // empty records
        window.supabaseClient = createMockSupabaseClient({ tables: { prayer_records: [] }, session: DEFAULT_SESSION });
        expect(await window.PrayerService.getPrayerStreak()).toBe(0);

        // today-missing branch and break on older missing
        const dateToday = window.getCurrentDate();
        const dateYesterdayObj = window.parseDate(dateToday);
        dateYesterdayObj.setDate(dateYesterdayObj.getDate() - 1);
        const dateYesterday = window.formatDate(dateYesterdayObj);

        window.supabaseClient = createMockSupabaseClient({
            tables: {
                prayer_records: [
                    { user_id: 'test-user-id', date: dateYesterday, status: 'done', prayer_key: 'fajr', recorded_at: new Date().toISOString() }
                ]
            },
            session: DEFAULT_SESSION
        });
        expect(await window.PrayerService.getPrayerStreak()).toBe(1);

        cleanup();
    });
});

describe('Habit Service Critical Coverage', () => {
    it('covers helper methods and public CRUD/stat flows', async () => {
        const { window, cleanup } = setupServiceWindow({
            scripts: ['js/services/points-service.js', 'js/services/habit-service.js'],
            tables: {
                habits: [
                    { id: 'h-w', user_id: 'test-user-id', name: 'Quran', type: 'worship', created_at: '2026-02-20T00:00:00.000Z' },
                    { id: 'h-s', user_id: 'test-user-id', name: 'No gossip', type: 'sin', created_at: '2026-02-20T00:00:00.000Z' }
                ],
                habit_history: [
                    { user_id: 'test-user-id', habit_id: 'h-w', date: '2026-02-20', action: 'done', recorded_at: '2026-02-20T00:00:00.000Z' },
                    { user_id: 'test-user-id', habit_id: 'h-w', date: '2026-02-21', action: 'done', recorded_at: '2026-02-21T00:00:00.000Z' },
                    { user_id: 'test-user-id', habit_id: 'h-s', date: '2026-02-20', action: 'avoided', recorded_at: '2026-02-20T00:00:00.000Z' },
                    { user_id: 'test-user-id', habit_id: 'h-s', date: '2026-02-21', action: 'committed', recorded_at: '2026-02-21T00:00:00.000Z' }
                ],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }],
                points_history: []
            }
        });

        // helper methods
        expect(window.HabitService._emptyStats()).toEqual(expect.objectContaining({ totalLoggedDays: 0 }));
        expect(window.HabitService._isSuccessAction('worship', 'done')).toBe(true);
        expect(window.HabitService._isSuccessAction('sin', 'avoided')).toBe(true);
        expect(window.HabitService._getWindowStart(-1)).toBeNull();
        expect(window.HabitService._getWindowStart(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        const streak = window.HabitService._calculateCurrentStreak({ '2026-02-23': 'done', '2026-02-22': 'done' }, 'worship');
        expect(streak).toBeGreaterThanOrEqual(0);
        const brokenStreak = window.HabitService._calculateCurrentStreak({ '2026-02-23': 'committed' }, 'worship');
        expect(brokenStreak).toBe(0);

        const longest = window.HabitService._calculateLongestStreak([
            { date: '2026-02-20', action: 'done' },
            { date: '2026-02-21', action: 'done' },
            { date: '2026-02-23', action: 'done' }
        ], 'worship');
        expect(longest).toBe(2);

        const worshipMetrics = window.HabitService._buildMetrics([
            { date: '2026-02-20', action: 'done' },
            { date: '2026-02-21', action: 'done' }
        ], 'worship', 30);
        expect(worshipMetrics.daysDone).toBe(2);

        const sinMetrics = window.HabitService._buildMetrics([
            { date: '2026-02-20', action: 'avoided' },
            { date: '2026-02-21', action: 'committed' }
        ], 'sin', 30);
        expect(sinMetrics.daysCommitted).toBe(1);

        expect(window.HabitService._buildViewModel('worship', worshipMetrics, worshipMetrics, 0)).toHaveProperty('allTimeItems');
        expect(window.HabitService._buildViewModel('sin', sinMetrics, sinMetrics, 0)).toHaveProperty('last30Items');

        // getAll / add / delete / history / dailyActions
        expect((await window.HabitService.getAll()).length).toBe(2);
        const added = await window.HabitService.add('New Habit', 'worship');
        expect(added.name).toBe('New Habit');

        await window.HabitService.delete('h-w');
        expect(window.supabaseClient.__tables.habits.find((h) => h.id === 'h-w')).toBeUndefined();

        const historyMap = await window.HabitService.getHistory('h-s');
        expect(historyMap['2026-02-21']).toBe('committed');

        const dailyActions = await window.HabitService.getDailyActions('2026-02-21');
        expect(dailyActions.length).toBeGreaterThan(0);

        // details + trend branch + null branch
        const details = await window.HabitService.getHabitDetailsStats('h-s');
        expect(details).toHaveProperty('habit.type', 'sin');

        const oldDate = window.parseDate(window.getCurrentDate());
        oldDate.setDate(oldDate.getDate() - 45);
        const oldDateStr = window.formatDate(oldDate);
        window.supabaseClient.__tables.habit_history = [
            { user_id: 'test-user-id', habit_id: 'h-s', date: oldDateStr, action: 'avoided', recorded_at: new Date().toISOString() }
        ];
        const detailsWithNullTrend = await window.HabitService.getHabitDetailsStats('h-s');
        expect(detailsWithNullTrend.viewModel.trendVsAllTime).toBeNull();

        expect(await window.HabitService.getHabitDetailsStats('missing')).toBeNull();

        // getHabitsCardMeta branches
        window.supabaseClient.__tables.habit_history = [
            { user_id: 'test-user-id', habit_id: 'h-s', date: '2026-02-21', action: 'committed', recorded_at: new Date().toISOString() }
        ];
        let cardMeta = await window.HabitService.getHabitsCardMeta('2026-02-21');
        expect(cardMeta.statusByHabitId).toEqual(expect.objectContaining({ 'h-s': 'committed' }));
        expect(cardMeta.streakByHabitId).toHaveProperty('h-s');

        cardMeta = await window.HabitService.getHabitsCardMeta(window.getCurrentDate());
        expect(cardMeta).toHaveProperty('statusByHabitId');

        window.supabaseClient.__tables.habits = [];
        cardMeta = await window.HabitService.getHabitsCardMeta(window.getCurrentDate());
        expect(cardMeta).toEqual({ statusByHabitId: {}, streakByHabitId: {} });

        // getStats branches
        const noDetailsSpy = vi.spyOn(window.HabitService, 'getHabitDetailsStats').mockResolvedValue(null);
        const emptyStats = await window.HabitService.getStats('h-none');
        expect(emptyStats).toEqual(expect.objectContaining({ totalLoggedDays: 0 }));
        noDetailsSpy.mockRestore();

        window.supabaseClient.__tables.habits = [{ id: 'h-s', user_id: 'test-user-id', name: 'No gossip', type: 'sin', created_at: new Date().toISOString() }];
        window.supabaseClient.__tables.habit_history = [
            { user_id: 'test-user-id', habit_id: 'h-s', date: window.getCurrentDate(), action: 'avoided', recorded_at: new Date().toISOString() }
        ];
        const statsSin = await window.HabitService.getStats('h-s', 30);
        expect(statsSin.successCount).toBeGreaterThanOrEqual(0);

        // logAction branches
        const pointsSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);

        // no client/no session guards
        const keepClient = window.supabaseClient;
        window.supabaseClient = null;
        await expect(window.HabitService.logAction('h-s', window.getCurrentDate(), 'avoided')).resolves.toBeUndefined();
        window.supabaseClient = keepClient;

        window.AuthManager.setSession(null);
        await expect(window.HabitService.logAction('h-s', window.getCurrentDate(), 'avoided')).resolves.toBeUndefined();
        window.AuthManager.setSession(DEFAULT_SESSION);

        // missing habit throws
        await expect(window.HabitService.logAction('missing', window.getCurrentDate(), 'done')).rejects.toThrow();

        // worship done -> +1
        window.supabaseClient.__tables.habits.push({ id: 'h-w2', user_id: 'test-user-id', name: 'Tilawa', type: 'worship', created_at: new Date().toISOString() });
        await window.HabitService.logAction('h-w2', window.getCurrentDate(), 'done');
        expect(pointsSpy).toHaveBeenCalledWith(1, 'Tilawa', `habit:h-w2:${window.getCurrentDate()}`);

        // sin committed -> -10
        await window.HabitService.logAction('h-s', window.getCurrentDate(), 'committed');
        expect(pointsSpy).toHaveBeenCalledWith(-10, expect.any(String), `habit:h-s:${window.getCurrentDate()}`);

        // sin avoided -> +1
        await window.HabitService.logAction('h-s', window.getCurrentDate(), 'avoided');
        expect(pointsSpy).toHaveBeenCalledWith(1, expect.any(String), `habit:h-s:${window.getCurrentDate()}`);

        // sin with non-recognized action -> 0
        await window.HabitService.logAction('h-s', window.getCurrentDate(), 'done');
        expect(pointsSpy).toHaveBeenCalledWith(0, '', `habit:h-s:${window.getCurrentDate()}`);

        // removeAction + getStreak + reset
        const streakValue = await window.HabitService.getStreak('h-s');
        expect(streakValue).toBeGreaterThanOrEqual(0);

        await window.HabitService.removeAction('h-s', window.getCurrentDate());
        expect(pointsSpy).toHaveBeenCalledWith(0, 'Reset habit action', `habit:h-s:${window.getCurrentDate()}`);

        const resetResult = await window.HabitService.reset('h-s', window.getCurrentDate());
        expect(resetResult).toEqual({ success: true });

        // getStreak no client/no session/missing data
        window.supabaseClient = null;
        expect(await window.HabitService.getStreak('h-s')).toBe(0);
        window.supabaseClient = keepClient;

        window.AuthManager.setSession(null);
        expect(await window.HabitService.getStreak('h-s')).toBe(0);
        window.AuthManager.setSession(DEFAULT_SESSION);

        window.supabaseClient.__tables.habits = [];
        window.supabaseClient.__tables.habit_history = [];
        expect(await window.HabitService.getStreak('h-s')).toBe(0);

        // no client/no session branches for other methods
        window.supabaseClient = null;
        expect(await window.HabitService.getAll()).toEqual([]);
        expect(await window.HabitService.add('x', 'worship')).toBeNull();
        await expect(window.HabitService.delete('id')).resolves.toBeUndefined();
        expect(await window.HabitService.getHistory('id')).toEqual({});
        expect(await window.HabitService.getDailyActions(window.getCurrentDate())).toEqual([]);
        expect(await window.HabitService.getHabitDetailsStats('id')).toBeNull();
        expect(await window.HabitService.getHabitsCardMeta(window.getCurrentDate())).toEqual({ statusByHabitId: {}, streakByHabitId: {} });
        await expect(window.HabitService.removeAction('id', window.getCurrentDate())).resolves.toBeUndefined();

        window.supabaseClient = keepClient;
        window.AuthManager.setSession(null);
        expect(await window.HabitService.getAll()).toEqual([]);
        expect(await window.HabitService.add('x', 'worship')).toBeNull();
        expect(await window.HabitService.getDailyActions(window.getCurrentDate())).toEqual([]);
        expect(await window.HabitService.getHabitDetailsStats('id')).toBeNull();
        expect(await window.HabitService.getHabitsCardMeta(window.getCurrentDate())).toEqual({ statusByHabitId: {}, streakByHabitId: {} });
        await expect(window.HabitService.logAction('id', window.getCurrentDate(), 'done')).resolves.toBeUndefined();
        await expect(window.HabitService.removeAction('id', window.getCurrentDate())).resolves.toBeUndefined();

        pointsSpy.mockRestore();
        cleanup();
    });
});

describe('Task Service Coverage Support', () => {
    it('covers validation, filters, status transitions and maintenance', async () => {
        const { window, cleanup } = setupServiceWindow({
            scripts: ['js/services/points-service.js', 'js/services/task-service.js'],
            tables: {
                tasks: [
                    {
                        id: 't1',
                        user_id: 'test-user-id',
                        title: 'Today pending',
                        priority: 'high',
                        due_date: '2026-02-23',
                        status: 'pending',
                        completed_at: null,
                        rollover_count: 0,
                        created_at: '2026-02-20T00:00:00.000Z',
                        updated_at: '2026-02-20T00:00:00.000Z'
                    },
                    {
                        id: 't2',
                        user_id: 'test-user-id',
                        title: 'Upcoming pending',
                        priority: 'low',
                        due_date: '2026-02-24',
                        status: 'pending',
                        completed_at: null,
                        rollover_count: 0,
                        created_at: '2026-02-21T00:00:00.000Z',
                        updated_at: '2026-02-21T00:00:00.000Z'
                    },
                    {
                        id: 't3',
                        user_id: 'test-user-id',
                        title: 'Completed old',
                        priority: 'medium',
                        due_date: '2026-02-20',
                        status: 'completed',
                        completed_at: '2026-01-01T00:00:00.000Z',
                        rollover_count: 1,
                        created_at: '2026-01-01T00:00:00.000Z',
                        updated_at: '2026-01-01T00:00:00.000Z'
                    }
                ],
                leaderboard: [{ user_id: 'test-user-id', total_points: 0 }],
                points_history: []
            }
        });

        expect(window.TaskService._priorityWeight('high')).toBe(3);
        expect(window.TaskService._priorityWeight('x')).toBe(0);
        expect(window.TaskService._mapTaskRow(null)).toBeNull();
        expect(window.TaskService._sortTasks([], 'today')).toEqual([]);

        const todayTasks = await window.TaskService.getTasksByFilter('today', '2026-02-23');
        expect(todayTasks.map((t) => t.id)).toEqual(['t1']);

        const upcoming = await window.TaskService.getTasksByFilter('upcoming', '2026-02-23');
        expect(upcoming.map((t) => t.id)).toEqual(['t2']);

        const completed = await window.TaskService.getTasksByFilter('completed', '2026-02-23');
        expect(completed.map((t) => t.id)).toContain('t3');

        expect(await window.TaskService.getTaskById('missing')).toBeNull();
        expect(await window.TaskService.getTaskById('t1')).toEqual(expect.objectContaining({ id: 't1' }));

        await expect(window.TaskService.createTask({ title: '', priority: 'medium', dueDate: '2026-02-23' })).rejects.toThrow('TASK_TITLE_REQUIRED');
        await expect(window.TaskService.createTask({ title: 'x'.repeat(141), priority: 'medium', dueDate: '2026-02-23' })).rejects.toThrow('TASK_TITLE_TOO_LONG');
        await expect(window.TaskService.createTask({ title: 'Valid', priority: 'urgent', dueDate: '2026-02-23' })).rejects.toThrow('TASK_PRIORITY_INVALID');
        await expect(window.TaskService.createTask({ title: 'Valid', priority: 'high', dueDate: 'invalid' })).rejects.toThrow('TASK_DATE_INVALID');

        const created = await window.TaskService.createTask({ title: 'Created', priority: 'medium', dueDate: '2026-02-23' });
        expect(created.title).toBe('Created');

        await expect(window.TaskService.updateTask('missing', { title: 'x' })).rejects.toThrow('TASK_NOT_FOUND');
        await expect(window.TaskService.updateTask('t3', { title: 'x' })).rejects.toThrow('TASK_EDIT_COMPLETED_FORBIDDEN');

        const updated = await window.TaskService.updateTask('t1', { title: 'Updated', priority: 'low', dueDate: '2026-02-25' });
        expect(updated).toEqual(expect.objectContaining({ title: 'Updated', priority: 'low', dueDate: '2026-02-25' }));

        const pointsSpy = vi.spyOn(window.PointsService, 'addPoints').mockResolvedValue(true);
        expect((await window.TaskService.toggleTaskStatus('t1', 'pending')).status).toBe('pending');
        expect((await window.TaskService.toggleTaskStatus('t1', 'completed')).status).toBe('completed');
        expect(pointsSpy).toHaveBeenCalledWith(1, expect.any(String), 'task:t1');
        expect((await window.TaskService.toggleTaskStatus('t1', 'pending')).status).toBe('pending');
        expect(pointsSpy).toHaveBeenCalledWith(0, 'Task completion removed', 'task:t1');

        await expect(window.TaskService.deleteTask('missing')).rejects.toThrow('TASK_NOT_FOUND');
        await expect(window.TaskService.deleteTask('t3')).rejects.toThrow('TASK_DELETE_COMPLETED_FORBIDDEN');

        expect(await window.TaskService.deleteTask('t2')).toBe(true);

        const rollover = await window.TaskService.rolloverPendingTasks('2026-02-23');
        expect(rollover.updatedCount).toBeGreaterThanOrEqual(0);

        const cleanupStats = await window.TaskService.cleanupCompletedTasks(-5);
        expect(cleanupStats).toHaveProperty('deletedCount');

        const dailyStats = await window.TaskService.getDailyTaskStats('2026-02-23');
        expect(dailyStats).toHaveProperty('total');

        // guard branches
        const keepClient = window.supabaseClient;
        window.supabaseClient = null;
        expect(await window.TaskService.getTasksByFilter('today')).toEqual([]);
        expect(await window.TaskService.getTaskById('x')).toBeNull();
        expect(await window.TaskService.createTask({ title: 'x', priority: 'low', dueDate: '2026-02-23' })).toBeNull();
        expect(await window.TaskService.updateTask('x', { title: 'x' })).toBeNull();
        expect(await window.TaskService.toggleTaskStatus('x', 'completed')).toBeNull();
        expect(await window.TaskService.deleteTask('x')).toBe(false);
        expect(await window.TaskService.rolloverPendingTasks()).toEqual({ updatedCount: 0 });
        expect(await window.TaskService.cleanupCompletedTasks()).toEqual({ deletedCount: 0 });
        expect(await window.TaskService.getDailyTaskStats()).toEqual({ total: 0, done: 0, pending: 0, rate: 0 });

        window.supabaseClient = keepClient;
        window.AuthManager.setSession(null);
        expect(await window.TaskService.getTasksByFilter('today')).toEqual([]);
        expect(await window.TaskService.getTaskById('x')).toBeNull();
        expect(await window.TaskService.createTask({ title: 'x', priority: 'low', dueDate: '2026-02-23' })).toBeNull();
        expect(await window.TaskService.updateTask('x', { title: 'x' })).toBeNull();
        expect(await window.TaskService.toggleTaskStatus('x', 'completed')).toBeNull();
        expect(await window.TaskService.deleteTask('x')).toBe(false);
        expect(await window.TaskService.rolloverPendingTasks()).toEqual({ updatedCount: 0 });
        expect(await window.TaskService.cleanupCompletedTasks()).toEqual({ deletedCount: 0 });
        expect(await window.TaskService.getDailyTaskStats()).toEqual({ total: 0, done: 0, pending: 0, rate: 0 });

        pointsSpy.mockRestore();
        cleanup();
    });
});
