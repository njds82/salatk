import fs from 'node:fs';
import vm from 'node:vm';
import { repoPath } from '../helpers/paths.js';

describe('Service Worker', () => {
    function setupSwContext() {
        const listeners = {};
        const cacheStore = new Map();
        const shownNotifications = [];

        const caches = {
            async open(name) {
                if (!cacheStore.has(name)) {
                    cacheStore.set(name, new Map());
                }
                const cache = cacheStore.get(name);
                return {
                    addAll: async (assets) => {
                        for (const asset of assets) {
                            cache.set(asset, { asset });
                        }
                    },
                    put: async (request, response) => {
                        cache.set(request.url || request, response);
                    }
                };
            },
            async keys() {
                return [...cacheStore.keys()];
            },
            async delete(name) {
                return cacheStore.delete(name);
            },
            async match(request) {
                const key = request.url || request;
                for (const cache of cacheStore.values()) {
                    if (cache.has(key)) return cache.get(key);
                }
                return null;
            }
        };

        const context = {
            console,
            caches,
            fetch: async () => ({ status: 200, type: 'basic', clone() { return this; } }),
            clients: {
                async claim() { },
                async matchAll() { return []; },
                async openWindow() { }
            },
            self: {
                skipWaiting: () => { },
                registration: {
                    async showNotification(title, options) {
                        shownNotifications.push({ title, options });
                    }
                },
                clients: {
                    async claim() { },
                    async matchAll() { return []; },
                    async openWindow() { }
                },
                addEventListener(type, callback) {
                    listeners[type] = callback;
                }
            }
        };

        vm.createContext(context);
        const source = fs.readFileSync(repoPath('sw.js'), 'utf8');
        vm.runInContext(source, context, { filename: repoPath('sw.js') });

        return { listeners, shownNotifications };
    }

    it('registers all expected lifecycle listeners', () => {
        const { listeners } = setupSwContext();

        expect(typeof listeners.install).toBe('function');
        expect(typeof listeners.activate).toBe('function');
        expect(typeof listeners.fetch).toBe('function');
        expect(typeof listeners.push).toBe('function');
        expect(typeof listeners.notificationclick).toBe('function');
    });

    it('handles fetch events using respondWith', async () => {
        const { listeners } = setupSwContext();
        const respondWith = vi.fn();

        await listeners.fetch({
            request: { url: 'http://localhost/styles.css', method: 'GET' },
            respondWith
        });

        expect(respondWith).toHaveBeenCalled();
    });

    it('handles push events and shows browser notifications', async () => {
        const { listeners, shownNotifications } = setupSwContext();
        const waitUntil = vi.fn(async (promise) => {
            await promise;
        });

        await listeners.push({
            data: {
                json: () => ({
                    title: 'Admin Alert',
                    body: 'User report received',
                    url: '/admin'
                })
            },
            waitUntil
        });

        expect(waitUntil).toHaveBeenCalled();
        expect(shownNotifications).toHaveLength(1);
        expect(shownNotifications[0]).toEqual(expect.objectContaining({
            title: 'Admin Alert',
            options: expect.objectContaining({
                body: 'User report received',
                data: { url: '/admin' }
            })
        }));
    });
});
