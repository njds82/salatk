// ========================================
// Push Service
// ========================================

const PushService = {
    _syncedAt: 0,

    _isSupported() {
        return Boolean(
            window.isSecureContext
            && navigator.serviceWorker
            && window.PushManager
            && window.Notification
        );
    },

    _publicVapidKey() {
        return window.CONFIG?.WEB_PUSH_VAPID_PUBLIC_KEY || '';
    },

    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    async _invoke(action, payload = {}) {
        const session = await window.AuthManager.getSession();
        if (!session?.access_token) {
            throw new Error('AUTH_REQUIRED');
        }

        const response = await fetch(`${window.CONFIG?.SUPABASE_URL}/functions/v1/push-subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': window.CONFIG?.SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({
                action,
                ...payload
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.ok === false) {
            throw new Error(data?.code || 'PUSH_SUBSCRIPTION_FAILED');
        }
        return data.data || {};
    },

    async _registration() {
        if (!navigator.serviceWorker) return null;
        try {
            return await navigator.serviceWorker.ready;
        } catch (e) {
            console.warn('PushService: SW registration not ready', e);
            return null;
        }
    },

    async getSubscription() {
        if (!this._isSupported()) return null;
        const registration = await this._registration();
        if (!registration) return null;
        return registration.pushManager.getSubscription();
    },

    async getStatus() {
        const supported = this._isSupported();
        if (!supported) {
            return {
                supported: false,
                permission: 'unsupported',
                subscribed: false
            };
        }

        const subscription = await this.getSubscription();
        return {
            supported: true,
            permission: Notification.permission,
            subscribed: Boolean(subscription)
        };
    },

    async _syncSubscription(subscription) {
        const raw = subscription?.toJSON ? subscription.toJSON() : null;
        const endpoint = raw?.endpoint || subscription?.endpoint;
        const p256dh = raw?.keys?.p256dh;
        const authKey = raw?.keys?.auth;

        if (!endpoint || !p256dh || !authKey) {
            throw new Error('INVALID_SUBSCRIPTION_PAYLOAD');
        }

        await this._invoke('upsert', {
            subscription: {
                endpoint,
                p256dh,
                auth_key: authKey
            }
        });
    },

    async subscribe({ requestPermission = true } = {}) {
        if (!this._isSupported()) {
            throw new Error('PUSH_NOT_SUPPORTED');
        }

        const vapidPublicKey = this._publicVapidKey();
        if (!vapidPublicKey) {
            throw new Error('PUSH_PUBLIC_KEY_MISSING');
        }

        if (Notification.permission !== 'granted') {
            if (!requestPermission) return null;
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('PUSH_PERMISSION_DENIED');
            }
        }

        const registration = await this._registration();
        if (!registration) throw new Error('PUSH_SW_NOT_READY');

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this._urlBase64ToUint8Array(vapidPublicKey)
            });
        }

        await this._syncSubscription(subscription);
        return subscription;
    },

    async unsubscribe() {
        const subscription = await this.getSubscription();
        if (!subscription) return;

        const endpoint = subscription.endpoint;

        try {
            await subscription.unsubscribe();
        } catch (e) {
            console.warn('PushService: Failed to unsubscribe browser push subscription', e);
        }

        if (endpoint) {
            await this._invoke('remove', { endpoint });
        }
    },

    async toggle() {
        const status = await this.getStatus();
        if (!status.supported) throw new Error('PUSH_NOT_SUPPORTED');

        if (status.subscribed) {
            await this.unsubscribe();
            return { subscribed: false };
        }

        await this.subscribe({ requestPermission: true });
        return { subscribed: true };
    },

    async initAutoSubscribe() {
        try {
            const session = await window.AuthManager.getSession();
            if (!session) return;

            if (!this._isSupported() || !this._publicVapidKey()) return;

            if (Notification.permission === 'granted') {
                await this.subscribe({ requestPermission: false });
            }
        } catch (e) {
            console.warn('PushService: Auto subscribe skipped', e);
        }
    },

    async hydrateFallbackNotifications() {
        if (!window.AdminService) return;

        const now = Date.now();
        if (now - this._syncedAt < 30000) return;
        this._syncedAt = now;

        try {
            const unread = await window.AdminService.getUnreadNotifications(20);
            for (const item of unread) {
                const title = item.title || t('notifications_title');
                const message = item.body || '';
                showToast(`${title}: ${message}`, 'info');
                await window.AdminService.markNotificationRead(item.id);
            }
        } catch (e) {
            console.warn('PushService: Failed to hydrate in-app fallback notifications', e);
        }
    }
};

window.PushService = PushService;

