// ========================================
// Database Configuration (Cloud-Only Stub)
// ========================================
// Local IndexedDB has been removed as per user request. 
// This file is kept as a stub to avoid breaking imports 
// until all references are removed.

const db = {
    // Stub to prevent crashes if something still calls it
    settings: { toArray: async () => [], get: async () => null, put: async () => { } },
    prayers: { toArray: async () => [], where: () => ({ toArray: async () => [] }), get: async () => null, put: async () => { }, delete: async () => { } },
    qada: { toArray: async () => [], where: () => ({ toArray: async () => [], first: async () => null }), get: async () => null, put: async () => { }, add: async () => { }, delete: async () => { } },
    habits: { toArray: async () => [], get: async () => null, put: async () => { }, add: async () => { }, delete: async () => { } },
    habit_history: { toArray: async () => [], where: () => ({ toArray: async () => [], delete: async () => [] }), get: async () => null, put: async () => { }, delete: async () => { } },
    points: { toArray: async () => [], orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }), get: async () => null, put: async () => { }, delete: async () => { }, bulkDelete: async () => { } },
    delete: async () => { console.log('Local DB delete (No-op)'); }
};

window.db = db;
