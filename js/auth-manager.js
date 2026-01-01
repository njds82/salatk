// ========================================
// Authentication Manager
// ========================================

const AuthManager = {
    // Helper to resolve username to an email address
    _resolveAuthEmail(username) {
        // Enforce username only - no spaces, specific regex if needed, but for now simple trim
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

    async isAuthenticated() {
        if (this._session) return true;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        this._session = session;
        return !!session;
    },

    setSession(session) {
        this._session = session;
    }
};

window.AuthManager = AuthManager;
