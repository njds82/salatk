// ========================================
// Offline Store — IndexedDB Cache
// ========================================
// Provides a simple key/value and per-table cache so the app can
// render last-known data when the network is unavailable.
// All writes are "fire and forget" — they never block cloud operations.

const OfflineStore = (() => {
    const DB_NAME = 'salatk_offline';
    const DB_VERSION = 1;
    const STORES = ['prayers', 'habits', 'habit_history', 'tasks', 'qada', 'settings', 'location', 'meta'];

    let _db = null;
    let _openPromise = null;

    function _open() {
        if (_db) return Promise.resolve(_db);
        if (_openPromise) return _openPromise;

        _openPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                STORES.forEach((name) => {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, { keyPath: 'key' });
                    }
                });
            };

            req.onsuccess = (e) => {
                _db = e.target.result;
                _openPromise = null;
                resolve(_db);
            };

            req.onerror = (e) => {
                _openPromise = null;
                console.warn('OfflineStore: IndexedDB open failed', e.target.error);
                reject(e.target.error);
            };
        });

        return _openPromise;
    }

    async function _tx(storeName, mode, fn) {
        try {
            const db = await _open();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, mode);
                const store = tx.objectStore(storeName);
                const req = fn(store);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.warn(`OfflineStore: ${storeName} ${mode} failed`, e);
            return null;
        }
    }

    // ------- Public API -------

    /** Save any JSON-serialisable value under a key in a store */
    async function set(storeName, key, value) {
        await _tx(storeName, 'readwrite', (store) =>
            store.put({ key, value, updatedAt: Date.now() })
        );
    }

    /** Retrieve a value by key from a store. Returns null if not found. */
    async function get(storeName, key) {
        const record = await _tx(storeName, 'readonly', (store) => store.get(key));
        return record ? record.value : null;
    }

    /** Delete a key from a store */
    async function del(storeName, key) {
        await _tx(storeName, 'readwrite', (store) => store.delete(key));
    }

    /** Clear an entire store */
    async function clearStore(storeName) {
        await _tx(storeName, 'readwrite', (store) => store.clear());
    }

    /** Clear ALL offline data (e.g. on sign-out) */
    async function clearAll() {
        for (const name of STORES) {
            await clearStore(name);
        }
    }

    return { set, get, del, clearStore, clearAll };
})();

window.OfflineStore = OfflineStore;
