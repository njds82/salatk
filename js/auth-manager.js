// ========================================
// Authentication Manager
// ========================================

const AuthManager = {
    // Helper to resolve username or email to an email address
    _resolveEmail(input) {
        const isEmail = String(input).toLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if (isEmail) return { email: input, isUsername: false };

        // Treat as username
        let username = input.trim();
        if (username.startsWith('@')) username = username.substring(1);

        // Basic validation for username
        if (username.length < 3) throw new Error(t('username_too_short') || 'Username too short');

        // Generate dummy email
        return {
            email: `${username}@salatk.local`,
            isUsername: true,
            username
        };
    },

    async signUp(usernameOrEmail, password, fullName) {
        try {
            const { email, isUsername, username } = this._resolveEmail(usernameOrEmail);

            const options = {
                emailRedirectTo: 'https://salatk.pages.dev/',
                data: {
                    full_name: fullName
                }
            };

            if (isUsername) {
                options.data.username = username;
            }

            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options
            });

            if (data?.user && isUsername) {
                // If it's a username signup, we might want to ensure the profile table has the username
                // explicitly if the trigger doesn't handle it.
                await this.updateProfile({ username });
            }

            return { data, error };
        } catch (err) {
            return { error: err };
        }
    },

    async signIn(usernameOrEmail, password) {
        try {
            const { email } = this._resolveEmail(usernameOrEmail);

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

    isAuthenticated() {
        return !!window.supabaseClient.auth.getSession();
    }
};

window.AuthManager = AuthManager;
