import { test, expect } from '@playwright/test';

async function bootstrapApp(page) {
    await page.addInitScript(() => {
        const session = {
            user: {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'e2e@salatk.local'
            }
        };

        localStorage.setItem('salatk_auth_snapshot', JSON.stringify(session));
        localStorage.setItem('salatk_theme', 'light');
        localStorage.setItem('salatk_language', 'ar');
        localStorage.setItem('salatk_lang', 'ar');

        window.__SALATK_TEST__ = true;
        window.__SALATK_CONFIG__ = {
            SUPABASE_URL: 'http://127.0.0.1:54321',
            SUPABASE_ANON_KEY: 'local-anon-key'
        };

        const makeQuery = (result = { data: [], error: null }) => {
            const query = {
                select: () => query,
                insert: () => query,
                update: () => query,
                upsert: () => query,
                delete: () => query,
                eq: () => query,
                neq: () => query,
                gt: () => query,
                gte: () => query,
                lt: () => query,
                lte: () => query,
                in: () => query,
                is: () => query,
                order: () => query,
                limit: () => query,
                single: async () => ({ data: null, error: null }),
                maybeSingle: async () => ({ data: null, error: null }),
                then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
            };
            return query;
        };

        const mockClient = {
            auth: {
                signInWithPassword: async () => ({ data: { session }, error: null }),
                signUp: async () => ({ data: { session, user: session.user }, error: null }),
                signOut: async () => ({ error: null }),
                getSession: async () => ({ data: { session }, error: null }),
                getUser: async () => ({ data: { user: session.user }, error: null }),
                updateUser: async () => ({ error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                session: () => session
            },
            from: (table) => {
                if (table === 'profiles') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: async () => ({
                                    data: {
                                        id: session.user.id,
                                        full_name: 'E2E User',
                                        username: 'e2e',
                                        referral_code: 'E2E123',
                                        is_public: true,
                                        last_completed_stage: 0
                                    },
                                    error: null
                                }),
                                maybeSingle: async () => ({
                                    data: {
                                        id: session.user.id,
                                        full_name: 'E2E User',
                                        username: 'e2e',
                                        referral_code: 'E2E123',
                                        is_public: true,
                                        last_completed_stage: 0
                                    },
                                    error: null
                                })
                            }),
                            order: () => ({
                                order: () => ({
                                    limit: async () => ({ data: [], error: null })
                                })
                            })
                        }),
                        update: () => ({ eq: async () => ({ error: null }) }),
                        upsert: async () => ({ error: null })
                    };
                }

                if (table === 'leaderboard') {
                    return {
                        select: () => ({
                            eq: () => ({ maybeSingle: async () => ({ data: { total_points: 0 }, error: null }) }),
                            order: () => ({
                                order: () => ({
                                    limit: async () => ({
                                        data: [{ user_id: session.user.id, full_name: 'E2E User', total_points: 0 }],
                                        error: null
                                    })
                                })
                            }),
                            maybeSingle: async () => ({ data: { total_points: 0 }, error: null })
                        })
                    };
                }

                return makeQuery();
            },
            channel: () => ({
                on() {
                    return this;
                },
                subscribe() {
                    return { unsubscribe: () => { } };
                }
            })
        };

        window.supabase = {
            createClient: () => mockClient
        };
        window.Supabase = window.supabase;

        if (!window.Notification) {
            window.Notification = class {
                static permission = 'granted';
                static async requestPermission() {
                    return 'granted';
                }
                close() { }
            };
        }
    });

    await page.goto('/index.html');
    await page.waitForSelector('#pageContent');

    // Ensure authenticated state is available synchronously before route assertions.
    await page.waitForFunction(() => Boolean(window.AuthManager && window.AuthManager.setSession));
    await page.evaluate(() => {
        const session = {
            user: {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'e2e@salatk.local'
            }
        };
        localStorage.setItem('salatk_auth_snapshot', JSON.stringify(session));
        window.AuthManager.setSession(session);

        // Keep mock auth session deterministic across page renders.
        if (window.supabaseClient?.auth) {
            window.supabaseClient.auth.getSession = async () => ({ data: { session }, error: null });
            window.supabaseClient.auth.session = () => session;
        }
    });
}

async function go(page, hash, selector) {
    await page.evaluate((nextHash) => {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo(nextHash);
            return;
        }

        window.location.hash = nextHash.startsWith('#') ? nextHash : `#${nextHash}`;
    }, hash);

    await page.waitForSelector(selector);
}

test('auth pages render', async ({ page }) => {
    await bootstrapApp(page);

    // Force logged-out state to validate auth forms.
    await page.evaluate(() => {
        localStorage.removeItem('salatk_auth_snapshot');
        if (window.AuthManager?.setSession) {
            window.AuthManager.setSession(null);
        }
        if (window.supabaseClient?.auth) {
            window.supabaseClient.auth.getSession = async () => ({ data: { session: null }, error: null });
            window.supabaseClient.auth.session = () => null;
        }
    });

    await go(page, 'login', '#authForm');
    await expect(page.locator('#authForm')).toBeVisible();

    await go(page, 'signup', '#authForm');
    await expect(page.locator('#fullName')).toBeVisible();
});

test('daily prayers and qada pages render', async ({ page }) => {
    await bootstrapApp(page);

    await go(page, 'daily-prayers', '#prayer-cards-container');
    await expect(page.locator('#prayer-cards-container')).toBeVisible();

    await go(page, 'qada-prayers', 'button[onclick="showAddQadaModal()"]');
    await expect(page.locator('button[onclick="showAddQadaModal()"]')).toBeVisible();
});

test('habits and tasks pages render', async ({ page }) => {
    await bootstrapApp(page);

    await go(page, 'habits', 'button[onclick="showAddHabitModal()"]');
    await expect(page.locator('button[onclick="showAddHabitModal()"]')).toBeVisible();

    await go(page, 'daily-tasks', 'button[onclick="showAddTaskModal()"]');
    await expect(page.locator('button[onclick="showAddTaskModal()"]')).toBeVisible();
});

test('statistics leaderboard store settings athkar challenge more render', async ({ page }) => {
    await bootstrapApp(page);

    await go(page, 'statistics', '.chart-container');
    await expect(page.locator('.chart-container')).toBeVisible();

    await go(page, 'leaderboard', '.page-title');
    await expect(page.locator('.page-title')).toContainText(/لوحة الصدارة|Leaderboard/);

    await go(page, 'store', '.theme-card');
    await expect(page.locator('.theme-card').first()).toBeVisible();

    await go(page, 'settings', '#calcMethodSelect');
    await expect(page.locator('#calcMethodSelect')).toBeVisible();

    await go(page, 'athkar', '#readBtn');
    await expect(page.locator('#readBtn')).toBeVisible();

    await go(page, 'challenge', '#challenge-page');
    await expect(page.locator('#challenge-page')).toBeVisible();

    await go(page, 'more', '.more-grid');
    await expect(page.locator('.more-grid')).toBeVisible();
});
