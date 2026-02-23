export function installBrowserMocks(window, options = {}) {
    const permission = options.notificationPermission || 'granted';

    class MockNotification {
        static permission = permission;

        static async requestPermission() {
            return MockNotification.permission;
        }

        constructor(title, config = {}) {
            this.title = title;
            this.config = config;
            this.closed = false;
        }

        close() {
            this.closed = true;
        }
    }

    window.Notification = MockNotification;
    window.alert = () => { };

    if (!window.navigator.clipboard) {
        window.navigator.clipboard = {
            writeText: async () => { }
        };
    }

    if (!window.navigator.vibrate) {
        window.navigator.vibrate = () => true;
    }

    if (!window.navigator.share) {
        window.navigator.share = async () => { };
    }

    window.navigator.serviceWorker = {
        controller: {},
        register: async () => ({ scope: '/' }),
        ready: Promise.resolve({
            showNotification: async () => { }
        })
    };

    return { MockNotification };
}
