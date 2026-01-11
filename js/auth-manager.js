// ========================================
// Authentication Manager
// ========================================

const AuthManager = {
    // Helper for timeouts across the manager
    _withTimeout(promise, ms = 10000) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
        });
        return Promise.race([
            promise,
            timeoutPromise
        ]).finally(() => clearTimeout(timeoutId));
    },

    // Helper to validate username
    _validateUsername(username) {
        if (!username) throw new Error(t('error_invalid_input'));

        const cleanUsername = username.trim().toLowerCase();

        // 1. Length check
        if (cleanUsername.length < 3) throw new Error(t('username_too_short'));

        // 2. Forbidden words check
        const forbiddenTerms = ['admin', 'root', 'system', 'moderator', 'support', 'help', 'info', 'salatk', 'allah', 'god', 'prophet', 'test', 'testing', 'tester'];

        // Check for exact forbidden terms
        if (forbiddenTerms.includes(cleanUsername)) {
            throw new Error(t('error_username_forbidden'));
        }

        // Check for "test" variations (starts with test followed by digit/separator, or ends with test preceded by digit/separator)
        // This bans: test1, test_user, user_test, 1test
        // This ALLOWS: contest, latest, protest
        if (/(^test[\d_])|([\d_]test$)/.test(cleanUsername)) {
            throw new Error(t('error_username_forbidden'));
        }

        // Also ban pure numbers to avoid confusion? (Optional, but good for username-like feel)
        // For now, adhere to "test and similar".

        return cleanUsername;
    },

    // Helper to resolve username to an email address
    _resolveAuthEmail(username) {
        let cleanUsername = username.trim();
        // Remove @ if user added it
        if (cleanUsername.startsWith('@')) cleanUsername = cleanUsername.substring(1);

        // Validate content
        this._validateUsername(cleanUsername);

        // Generate dummy email
        return {
            email: `${cleanUsername}@salatk.local`,
            username: cleanUsername
        };
    },

    async signUp(username, password, fullName) {
        try {
            const { email, username: cleanUsername } = this._resolveAuthEmail(username);

            const options = {
                emailRedirectTo: 'https://salatk.pages.dev/',
                data: {
                    full_name: fullName,
                    username: cleanUsername
                }
            };

            const { data, error } = await this._withTimeout(window.supabaseClient.auth.signUp({
                email,
                password,
                options
            }));

            if (data?.session) {
                this.setSession(data.session);
            }

            if (data?.user) {
                // Ensure profile is updated, but don't block too long if it fails
                try {
                    await this.updateProfile({ username: cleanUsername });
                } catch (e) {
                    console.warn('AuthManager: Post-signup profile update failed or timed out', e);
                }
            }

            return { data, error };
        } catch (err) {
            // Map Supabase "User already registered" to "Username taken"
            if (err.message && (err.message.includes('already registered') || err.message.includes('duplicate key'))) {
                return { error: { message: t('error_username_taken') } };
            }
            return { error: err.message === 'timeout' ? { message: t('error_timeout') || 'Operation timed out' } : err };
        }
    },

    async signIn(username, password) {
        try {
            const { email } = this._resolveAuthEmail(username);

            const { data, error } = await this._withTimeout(window.supabaseClient.auth.signInWithPassword({
                email,
                password
            }));
            if (data?.session) {
                this.setSession(data.session);
            }
            return { data, error };
        } catch (err) {
            return { error: err.message === 'timeout' ? { message: t('error_timeout') || 'Operation timed out' } : err };
        }
    },

    async signOut() {
        const { error } = await window.supabaseClient.auth.signOut();
        if (!error) {
            localStorage.removeItem('salatk_session');
            localStorage.removeItem('salatk_auth_snapshot');
            // Clear local database to prevent data bleed between users
            if (window.db) {
                await window.db.delete();
            }
            window.location.reload();
        }
        return { error };
    },

    async getCurrentUser() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    },

    async getProfile() {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return data;
    },

    async updateProfile(updates) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error(t('error_login_required'));

        // Validate username if being updated
        if (updates.username) {
            this._validateUsername(updates.username);
        }

        // Update user metadata
        const { error: metaError } = await this._withTimeout(window.supabaseClient.auth.updateUser({
            data: updates
        }));

        if (metaError) {
            if (metaError.message && (metaError.message.includes('already registered') || metaError.message.includes('duplicate'))) {
                throw new Error(t('error_username_taken'));
            }
            throw metaError;
        }

        // Also update profiles table if it exists
        try {
            const { error: profileError } = await this._withTimeout(window.supabaseClient
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...updates,
                    updated_at: new Date().toISOString()
                }), 5000); // Shorter timeout for non-critical profile table

            if (profileError) console.warn('Profile table update failed:', profileError);
        } catch (e) {
            console.warn('Profile table update timed out');
        }

        return { success: true };
    },

    _session: null,
    _sessionPromise: null,

    async getSession() {
        if (this._session) return this._session;
        if (this._sessionPromise) return this._sessionPromise;

        // 1. Try to get from snapshot first for instant load
        const snapshot = localStorage.getItem('salatk_auth_snapshot');
        if (snapshot) {
            try {
                this._session = JSON.parse(snapshot);
                console.log('AuthManager: Using session snapshot');

                // 2. Trigger background refresh but don't await it if we have a snapshot
                // This allows the UI to render immediately
                this._refreshSessionBackground();

                return this._session;
            } catch (e) {
                console.warn('AuthManager: Failed to parse session snapshot');
            }
        }

        // 3. If no snapshot, check if Supabase already has a session in its internal state
        // This is a synchronous-ish check that might prevent unnecessary network waits
        const localSession = window.supabaseClient.auth.session ? window.supabaseClient.auth.session() : null;
        if (localSession) {
            this.setSession(localSession);
            this._refreshSessionBackground(); // Still refresh in background
            return localSession;
        }

        // 4. No snapshot or local memory, must wait for network
        return this._refreshSessionBackground();
    },

    async _refreshSessionBackground() {
        if (this._sessionPromise) return this._sessionPromise;

        const withTimeout = (promise, ms) => {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
            });
            return Promise.race([
                promise,
                timeoutPromise
            ]).finally(() => clearTimeout(timeoutId));
        };

        this._sessionPromise = (async () => {
            try {
                // Shorter timeout if we already have some session data to work with
                const timeoutMs = this._session ? 2000 : 5000;
                const { data: { session } } = await withTimeout(window.supabaseClient.auth.getSession(), timeoutMs);
                this.setSession(session);
                return session;
            } catch (err) {
                if (err.message === 'timeout') {
                    console.warn('AuthManager: getSession timed out');
                } else {
                    console.error('AuthManager: getSession error', err);
                }
                return this._session;
            } finally {
                this._sessionPromise = null;
            }
        })();

        return this._sessionPromise;
    },

    async isAuthenticated() {
        const session = await this.getSession();
        return !!session;
    },

    setSession(session) {
        console.log('AuthManager: session updated');
        this._session = session;
        if (session) {
            localStorage.setItem('salatk_auth_snapshot', JSON.stringify(session));
        } else {
            localStorage.removeItem('salatk_auth_snapshot');
        }
    }
};

window.AuthManager = AuthManager;
