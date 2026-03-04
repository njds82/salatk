// ========================================
// Admin Service
// ========================================

const AdminService = {
    _baseUrl() {
        return `${window.CONFIG?.SUPABASE_URL || ''}/functions/v1`;
    },

    async _resolveAccessToken() {
        let session = null;

        if (window.AuthManager?.getSession) {
            try {
                session = await window.AuthManager.getSession();
            } catch (_) {
                // Fall through to Supabase session lookup.
            }
        }

        if (session?.access_token) {
            return session.access_token;
        }

        if (window.supabaseClient?.auth?.getSession) {
            const { data, error } = await window.supabaseClient.auth.getSession();
            if (!error && data?.session?.access_token) {
                if (window.AuthManager?.setSession) {
                    window.AuthManager.setSession(data.session);
                }
                return data.session.access_token;
            }
        }

        return null;
    },

    async _invoke(functionName, payload) {
        const accessToken = await this._resolveAccessToken();
        if (!accessToken) {
            throw new Error('AUTH_REQUIRED');
        }

        const response = await fetch(`${this._baseUrl()}/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'apikey': window.CONFIG?.SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.ok === false) {
            const code = result?.code || 'ADMIN_FUNCTION_ERROR';
            throw new Error(code);
        }

        return result.data;
    },

    async listUsers({ page = 1, pageSize = 20, search = '', filter = 'all' } = {}) {
        return this._invoke('admin-users', {
            action: 'list',
            page,
            page_size: pageSize,
            search,
            filter
        });
    },

    async updateUserProfile({
        targetUserId,
        username,
        fullName,
        bio,
        isPublic
    }) {
        const payload = {
            action: 'update_profile',
            target_user_id: targetUserId
        };

        if (username !== undefined) payload.username = username;
        if (fullName !== undefined) payload.full_name = fullName;
        if (bio !== undefined) payload.bio = bio;
        if (isPublic !== undefined) payload.is_public = isPublic;

        return this._invoke('admin-users', payload);
    },

    async setBlockStatus({ targetUserId, blocked, reason }) {
        return this._invoke('admin-users', {
            action: 'set_block',
            target_user_id: targetUserId,
            blocked,
            reason
        });
    },

    async deleteUser(targetUserId) {
        return this._invoke('admin-users', {
            action: 'delete_user',
            target_user_id: targetUserId,
            confirm: 'DELETE'
        });
    },

    async sendNotificationToUser({ targetUserId, title, body, url }) {
        return this._invoke('admin-notifications', {
            action: 'send_single',
            target_user_id: targetUserId,
            title,
            body,
            url
        });
    },

    async broadcastNotification({ title, body, url }) {
        return this._invoke('admin-notifications', {
            action: 'send_broadcast',
            title,
            body,
            url
        });
    },

    async getAuditLogs(limit = 30) {
        const { data, error } = await window.supabaseClient
            .from('admin_audit_logs')
            .select('id,admin_user_id,action,target_user_id,status,metadata,error_message,created_at')
            .order('created_at', { ascending: false })
            .limit(Math.min(Math.max(1, Number(limit) || 30), 100));

        if (error) throw error;
        return data || [];
    },

    async getUnreadNotifications(limit = 20) {
        const user = await window.AuthManager.getCurrentUser();
        if (!user) return [];

        const { data, error } = await window.supabaseClient
            .from('user_notifications')
            .select('id,title,body,payload,is_read,created_at')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(Math.min(Math.max(1, Number(limit) || 20), 100));

        if (error) {
            console.warn('AdminService: Failed to fetch unread notifications', error);
            return [];
        }
        return data || [];
    },

    async markNotificationRead(notificationId) {
        if (!notificationId) return;
        await window.supabaseClient
            .from('user_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);
    }
};

window.AdminService = AdminService;
