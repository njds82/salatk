// ========================================
// Database Initialization (Dexie.js)
// ========================================

const db = new Dexie('SalatkDB');

db.version(1).stores({
    settings: 'key', // Key-value store (e.g. key='theme')
    prayers: '[date+key], date, status', // Compound Index for fast lookup
    qada: 'id, prayer, date',
    habits: 'id, type',
    habit_history: '[habitId+date], habitId, date', // Compound Index
    points: '++id, timestamp', // Auto-increment ID
    locations: 'id' // Singleton (id='user_location')
});

// Open the database
db.open().catch(function (e) {
    console.error("Open failed: " + e.stack);
});

// Make it global
window.db = db;
