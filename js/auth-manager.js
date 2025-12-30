// ========================================
// Authentication Manager
// ========================================

const AuthManager = {
    async signUp(email, password, fullName) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: 'https://salatk.pages.dev/',
                data: {
                    full_name: fullName
                }
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
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
