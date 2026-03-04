import { createBootstrappedWindow } from '../helpers/bootstrap.js';

function createAuthManagerWithToken(token = 'token-123') {
    return {
        async getSession() {
            return {
                access_token: token,
                user: {
                    id: 'test-user-id',
                    email: 'test@salatk.local'
                }
            };
        }
    };
}

describe('AdminService', () => {
    it('builds list payload correctly and returns data', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/admin-service.js'],
            authManager: createAuthManagerWithToken()
        });

        const fetchMock = vi.fn(async () => ({
            ok: true,
            async json() {
                return {
                    ok: true,
                    data: {
                        users: [],
                        total: 0,
                        page: 2,
                        page_size: 15
                    }
                };
            }
        }));

        window.fetch = fetchMock;
        globalThis.fetch = fetchMock;

        const result = await window.AdminService.listUsers({
            page: 2,
            pageSize: 15,
            search: 'khaled',
            filter: 'blocked'
        });

        expect(result).toEqual(expect.objectContaining({ page: 2, page_size: 15 }));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, request] = fetchMock.mock.calls[0];
        expect(url).toContain('/functions/v1/admin-users');
        expect(request.method).toBe('POST');

        const body = JSON.parse(request.body);
        expect(body).toEqual({
            action: 'list',
            page: 2,
            page_size: 15,
            search: 'khaled',
            filter: 'blocked'
        });

        cleanup();
    });

    it('throws function error code when edge function returns failure', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/admin-service.js'],
            authManager: createAuthManagerWithToken()
        });

        const fetchMock = vi.fn(async () => ({
            ok: false,
            async json() {
                return {
                    ok: false,
                    code: 'FORBIDDEN',
                    message: 'Admin required'
                };
            }
        }));

        window.fetch = fetchMock;
        globalThis.fetch = fetchMock;

        await expect(window.AdminService.deleteUser('00000000-0000-4000-8000-000000000000'))
            .rejects.toThrow('FORBIDDEN');

        cleanup();
    });

    it('maps update profile fields to edge payload keys', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/admin-service.js'],
            authManager: createAuthManagerWithToken()
        });

        const fetchMock = vi.fn(async () => ({
            ok: true,
            async json() {
                return { ok: true, data: { profile: { id: 'target-user-id' } } };
            }
        }));

        window.fetch = fetchMock;
        globalThis.fetch = fetchMock;

        await window.AdminService.updateUserProfile({
            targetUserId: 'target-user-id',
            username: 'khaled',
            fullName: 'Khaled A.',
            bio: 'Bio',
            isPublic: false
        });

        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(requestBody).toEqual({
            action: 'update_profile',
            target_user_id: 'target-user-id',
            username: 'khaled',
            full_name: 'Khaled A.',
            bio: 'Bio',
            is_public: false
        });

        cleanup();
    });
});

describe('PushService', () => {
    it('returns unsupported status when browser push APIs are unavailable', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/push-service.js'],
            authManager: createAuthManagerWithToken()
        });

        window.isSecureContext = false;

        const status = await window.PushService.getStatus();
        expect(status).toEqual({
            supported: false,
            permission: 'unsupported',
            subscribed: false
        });

        await expect(window.PushService.toggle()).rejects.toThrow('PUSH_NOT_SUPPORTED');

        cleanup();
    });

    it('subscribes and unsubscribes through push-subscriptions function', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/push-service.js'],
            authManager: createAuthManagerWithToken()
        });

        let activeSubscription = null;
        const subscription = {
            endpoint: 'https://push.example/sub-1',
            toJSON() {
                return {
                    endpoint: this.endpoint,
                    keys: {
                        p256dh: 'p256dh-key',
                        auth: 'auth-key'
                    }
                };
            },
            async unsubscribe() {
                activeSubscription = null;
                return true;
            }
        };

        const pushManager = {
            async getSubscription() {
                return activeSubscription;
            },
            async subscribe() {
                activeSubscription = subscription;
                return subscription;
            }
        };

        window.isSecureContext = true;
        window.PushManager = function PushManager() {};
        window.Notification.permission = 'granted';
        window.navigator.serviceWorker.ready = Promise.resolve({ pushManager });

        window.CONFIG = {
            ...(window.CONFIG || {}),
            WEB_PUSH_VAPID_PUBLIC_KEY: 'BEl6cW7P1Xq7Y7OUnxqz0A6l5A5h0mBxxsXqW8xxFqJv_2Q3k9N9nA8K5yb0hQLvUE8Qw0ZkC1N1iWn6e0f3QkA'
        };
        window.PushService._urlBase64ToUint8Array = () => new Uint8Array([1, 2, 3]);

        const fetchMock = vi.fn(async () => ({
            ok: true,
            async json() {
                return { ok: true, data: { ok: true } };
            }
        }));

        window.fetch = fetchMock;
        globalThis.fetch = fetchMock;

        const subscribeResult = await window.PushService.toggle();
        expect(subscribeResult).toEqual({ subscribed: true });

        let payload = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(payload.action).toBe('upsert');
        expect(payload.subscription.endpoint).toBe('https://push.example/sub-1');

        const unsubscribeResult = await window.PushService.toggle();
        expect(unsubscribeResult).toEqual({ subscribed: false });

        payload = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(payload.action).toBe('remove');
        expect(payload.endpoint).toBe('https://push.example/sub-1');

        cleanup();
    });
});
