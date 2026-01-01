// ========================================
// Authentication Manager
// ========================================

const AuthManager = {
    // Helper to resolve username to an email address
    _resolveAuthEmail(username) {
        // We will strictly treat any input as a username and append @salatk.local

        let cleanUsername = username.trim();
        // Remove @ if user added it
        if (cleanUsername.startsWith('@')) cleanUsername = cleanUsername.substring(1);

        // Basic validation for username
        if (cleanUsername.length < 3) throw new Error(t('username_too_short') || 'Username too short');

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

            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options
            });

            if (data?.user) {
                // Ensure profile is updated
                await this.updateProfile({ username: cleanUsername });
            }

            return { data, error };
        } catch (err) {
            return { error: err };
        }
    },

    async signIn(username, password) {
        try {
            const { email } = this._resolveAuthEmail(username);

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            return { data, error };
        } catch (err) {
            return { error: err };
        }
    },

    async signOut() {
        const { error } = await window.supabaseClient.auth.signOut();
        if (!error) {
            localStorage.removeItem('salatk_session');
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
        if (!user) throw new Error('No user logged in');

        // Update user metadata
        const { error: metaError } = await window.supabaseClient.auth.updateUser({
            data: updates
        });

        if (metaError) throw metaError;

        // Also update profiles table if it exists
        const { error: profileError } = await window.supabaseClient
            .from('profiles')
            .upsert({
                id: user.id,
                ...updates,
                updated_at: new Date().toISOString()
            });

        if (profileError) console.warn('Profile table update failed:', profileError);

        return { success: true };
    },

    _session: null,
    _sessionPromise: null,

    async getSession() {
        if (this._session) return this._session;
        if (this._sessionPromise) return this._sessionPromise;

        // Try to get from snapshot first for instant load
        const snapshot = localStorage.getItem('salatk_auth_snapshot');
        if (snapshot && !this._session) {
            try {
                this._session = JSON.parse(snapshot);
                console.log('AuthManager: Using session snapshot');
            } catch (e) {
                console.warn('AuthManager: Failed to parse session snapshot');
            }
        }

        // Helper for timeout
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
                // If we have a snapshot, we can afford a shorter timeout for revalidation
                const timeoutMs = this._session ? 3000 : 5000;
                const { data: { session } } = await withTimeout(window.supabaseClient.auth.getSession(), timeoutMs);
                this.setSession(session);
                return session;
            } catch (err) {
                if (err.message === 'timeout') {
                    console.warn('AuthManager: getSession timed out, using snapshot if available');
                } else {
                    console.error('AuthManager: getSession error', err);
                }
                return this._session; // Fallback to snapshot (could be null)
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
