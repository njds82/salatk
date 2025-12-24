// ========================================
// Auth Manager - Session & User Persistence
// ========================================

const AUTH_STORAGE_KEY = 'salatk_users';
const SESSION_STORAGE_KEY = 'salatk_session';

const AuthManager = {
    // Initialize
    init() {
        if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify([]));
        }
    },

    // Register a new user
    register(fullName, email, password) {
        const users = this.getUsers();

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'User already exists' };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            fullName,
            email,
            password, // In a real app, this should be hashed
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));

        // Create session
        this.createSession(newUser);
        return { success: true, user: newUser };
    },

    // Login
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.createSession(user);
            return { success: true, user };
        }

        return { success: false, message: 'Invalid email or password' };
    },

    // Logout
    logout() {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        window.location.hash = 'login';
        window.location.reload(); // Hard refresh to clear app state if needed
    },

    // Session Management
    createSession(user) {
        const sessionData = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            loginTime: Date.now()
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    },

    isLoggedIn() {
        return !!localStorage.getItem(SESSION_STORAGE_KEY);
    },

    getCurrentUser() {
        const session = localStorage.getItem(SESSION_STORAGE_KEY);
        return session ? JSON.parse(session) : null;
    },

    getUsers() {
        const users = localStorage.getItem(AUTH_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    },

    // Helper to get user-specific storage key
    getUserKey(baseKey) {
        const user = this.getCurrentUser();
        if (user && user.userId) {
            return `${baseKey}_${user.userId}`;
        }
        return baseKey; // Fallback for guest/shared
    }
};

// Initialize on load
AuthManager.init();
window.AuthManager = AuthManager;
