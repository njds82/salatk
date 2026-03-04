// ========================================
// Admin Page
// ========================================

const ADMIN_PAGE_STATE = {
    page: 1,
    pageSize: 12,
    search: '',
    filter: 'all',
    users: [],
    total: 0,
    auditLogs: []
};

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function adminTotalPages() {
    return Math.max(1, Math.ceil((ADMIN_PAGE_STATE.total || 0) / ADMIN_PAGE_STATE.pageSize));
}

async function refreshAdminPage() {
    return renderPage('admin', true, { forceFresh: true, preferCache: false });
}

async function renderAdminPage() {
    if (!window.AdminService) {
        return `
            <div class="page-header">
                <h1 class="page-title">${t('admin_title')}</h1>
                <p class="page-subtitle">${t('admin_subtitle')}</p>
            </div>
            <div class="card">
                <p style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-danger);">
                    ${t('admin_operation_failed')}
                </p>
                <button class="btn btn-primary" onclick="handleAdminRefresh()">${t('admin_refresh')}</button>
            </div>
        `;
    }

    let usersResult;
    let auditLogs;
    let loadErrorCode = '';

    try {
        [usersResult, auditLogs] = await Promise.all([
            window.AdminService.listUsers({
                page: ADMIN_PAGE_STATE.page,
                pageSize: ADMIN_PAGE_STATE.pageSize,
                search: ADMIN_PAGE_STATE.search,
                filter: ADMIN_PAGE_STATE.filter
            }),
            window.AdminService.getAuditLogs(25)
        ]);
    } catch (error) {
        console.error('Admin page load failed', error);
        loadErrorCode = error?.message || 'ADMIN_LOAD_FAILED';
        usersResult = { users: [], total: 0 };
        auditLogs = [];
    }

    ADMIN_PAGE_STATE.users = usersResult.users || [];
    ADMIN_PAGE_STATE.total = usersResult.total || 0;
    ADMIN_PAGE_STATE.auditLogs = auditLogs || [];

    const totalPages = adminTotalPages();
    const canGoPrev = ADMIN_PAGE_STATE.page > 1;
    const canGoNext = ADMIN_PAGE_STATE.page < totalPages;

    return `
        <div class="page-header">
            <h1 class="page-title">${t('admin_title')}</h1>
            <p class="page-subtitle">${t('admin_subtitle')}</p>
        </div>

        ${loadErrorCode ? `
            <div class="card" style="margin-bottom: var(--spacing-lg); border-color: var(--color-danger);">
                <p style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-danger);">${t('admin_operation_failed')}</p>
                <p style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-text-secondary); font-size: 0.85em;">
                    ${escapeHtml(loadErrorCode)}
                </p>
                <button class="btn btn-secondary btn-sm" onclick="handleAdminRefresh()">${t('admin_refresh')}</button>
            </div>
        ` : ''}

        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('admin_user_management')}</h3>
            <div style="display: grid; gap: var(--spacing-sm); grid-template-columns: 1fr;">
                <input
                    id="adminSearchInput"
                    type="text"
                    placeholder="${t('admin_search_placeholder')}"
                    value="${escapeHtml(ADMIN_PAGE_STATE.search)}"
                    style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated); color: var(--color-text-primary);"
                />
                <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
                    <select
                        id="adminFilterSelect"
                        style="min-width: 170px; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated); color: var(--color-text-primary);"
                    >
                        <option value="all" ${ADMIN_PAGE_STATE.filter === 'all' ? 'selected' : ''}>${t('admin_filter_all')}</option>
                        <option value="active" ${ADMIN_PAGE_STATE.filter === 'active' ? 'selected' : ''}>${t('admin_filter_active')}</option>
                        <option value="blocked" ${ADMIN_PAGE_STATE.filter === 'blocked' ? 'selected' : ''}>${t('admin_filter_blocked')}</option>
                    </select>
                    <button class="btn btn-primary" onclick="handleAdminApplyFilters()">${t('admin_apply_filters')}</button>
                    <button class="btn btn-secondary" onclick="handleAdminRefresh()">${t('admin_refresh')}</button>
                </div>
            </div>
            <p style="margin-top: var(--spacing-sm); color: var(--color-text-secondary); font-size: 0.9em;">
                ${t('admin_total_users')}: ${ADMIN_PAGE_STATE.total}
            </p>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('admin_broadcast_title')}</h3>
            <div style="display: grid; gap: var(--spacing-sm);">
                <input
                    id="adminBroadcastTitle"
                    type="text"
                    placeholder="${t('admin_notification_title_placeholder')}"
                    style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated); color: var(--color-text-primary);"
                />
                <textarea
                    id="adminBroadcastBody"
                    rows="3"
                    placeholder="${t('admin_notification_body_placeholder')}"
                    style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated); color: var(--color-text-primary);"
                ></textarea>
                <input
                    id="adminBroadcastUrl"
                    type="text"
                    placeholder="${t('admin_notification_url_placeholder')}"
                    value="/"
                    style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated); color: var(--color-text-primary);"
                />
                <button class="btn btn-primary" onclick="handleAdminBroadcast()">${t('admin_send_broadcast')}</button>
            </div>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">${t('admin_users_list')}</h3>
            <div style="display: grid; gap: var(--spacing-md);">
                ${ADMIN_PAGE_STATE.users.map((user) => `
                    <div style="padding: var(--spacing-md); border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-elevated);">
                        <div style="display: flex; justify-content: space-between; gap: var(--spacing-sm); align-items: center; margin-bottom: var(--spacing-sm); flex-wrap: wrap;">
                            <strong>@${escapeHtml(user.username || '-')}</strong>
                            <span class="badge ${user.is_blocked ? 'badge-danger' : 'badge-success'}">
                                ${user.is_blocked ? t('admin_user_blocked') : t('admin_user_active')}
                            </span>
                        </div>
                        <p style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-text-secondary); font-size: 0.85em;">
                            ID: ${escapeHtml(user.user_id)}
                        </p>
                        <div style="display: grid; gap: var(--spacing-sm);">
                            <input
                                id="adminUsername-${user.user_id}"
                                type="text"
                                value="${escapeHtml(user.username || '')}"
                                placeholder="${t('username_label')}"
                                style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);"
                            />
                            <input
                                id="adminFullName-${user.user_id}"
                                type="text"
                                value="${escapeHtml(user.full_name || '')}"
                                placeholder="${t('full_name')}"
                                style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);"
                            />
                            <textarea
                                id="adminBio-${user.user_id}"
                                rows="2"
                                placeholder="${t('bio')}"
                                style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-primary); color: var(--color-text-primary);"
                            >${escapeHtml(user.bio || '')}</textarea>
                            <label style="display: flex; align-items: center; gap: var(--spacing-xs); color: var(--color-text-secondary);">
                                <input id="adminIsPublic-${user.user_id}" type="checkbox" ${user.is_public ? 'checked' : ''} />
                                ${t('admin_public_profile')}
                            </label>
                            ${user.is_blocked && user.blocked_reason ? `<p style="margin: 0; color: var(--color-warning); font-size: 0.85em;">${t('admin_block_reason')}: ${escapeHtml(user.blocked_reason)}</p>` : ''}
                            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
                                <button class="btn btn-primary btn-sm" onclick="handleAdminSaveProfile('${user.user_id}')">${t('save')}</button>
                                <button class="btn ${user.is_blocked ? 'btn-success' : 'btn-warning'} btn-sm" onclick="handleAdminToggleBlock('${user.user_id}', ${user.is_blocked ? 'true' : 'false'})">
                                    ${user.is_blocked ? t('admin_unblock_user') : t('admin_block_user')}
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="handleAdminNotifyUser('${user.user_id}')">${t('admin_send_single_notification')}</button>
                                <button class="btn btn-danger btn-sm" onclick="handleAdminDeleteUser('${user.user_id}')">${t('admin_delete_user')}</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${ADMIN_PAGE_STATE.users.length === 0 ? `<p style="margin: 0; color: var(--color-text-secondary);">${t('admin_no_users')}</p>` : ''}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: var(--spacing-md);">
                <button class="btn btn-secondary btn-sm" onclick="handleAdminPagePrev()" ${canGoPrev ? '' : 'disabled'}>
                    ${t('previous_day')}
                </button>
                <span style="color: var(--color-text-secondary);">${ADMIN_PAGE_STATE.page} / ${totalPages}</span>
                <button class="btn btn-secondary btn-sm" onclick="handleAdminPageNext()" ${canGoNext ? '' : 'disabled'}>
                    ${t('next_day')}
                </button>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom: var(--spacing-md);">${t('admin_audit_logs_title')}</h3>
            <div style="display: grid; gap: var(--spacing-sm);">
                ${ADMIN_PAGE_STATE.auditLogs.map((log) => `
                    <div style="padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-elevated);">
                        <div style="display: flex; justify-content: space-between; gap: var(--spacing-sm); flex-wrap: wrap;">
                            <strong>${escapeHtml(log.action)}</strong>
                            <span class="badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}">${escapeHtml(log.status)}</span>
                        </div>
                        <p style="margin: 6px 0 0 0; color: var(--color-text-secondary); font-size: 0.85em;">
                            ${escapeHtml(log.created_at)}${log.target_user_id ? ` • target: ${escapeHtml(log.target_user_id)}` : ''}
                        </p>
                        ${log.error_message ? `<p style="margin: 4px 0 0 0; color: var(--color-danger); font-size: 0.85em;">${escapeHtml(log.error_message)}</p>` : ''}
                    </div>
                `).join('')}
                ${ADMIN_PAGE_STATE.auditLogs.length === 0 ? `<p style="margin: 0; color: var(--color-text-secondary);">${t('admin_no_audit_logs')}</p>` : ''}
            </div>
        </div>
    `;
}

async function handleAdminRefresh() {
    await refreshAdminPage();
}

async function handleAdminApplyFilters() {
    ADMIN_PAGE_STATE.search = document.getElementById('adminSearchInput')?.value?.trim() || '';
    ADMIN_PAGE_STATE.filter = document.getElementById('adminFilterSelect')?.value || 'all';
    ADMIN_PAGE_STATE.page = 1;
    await refreshAdminPage();
}

async function handleAdminPagePrev() {
    if (ADMIN_PAGE_STATE.page <= 1) return;
    ADMIN_PAGE_STATE.page -= 1;
    await refreshAdminPage();
}

async function handleAdminPageNext() {
    const totalPages = adminTotalPages();
    if (ADMIN_PAGE_STATE.page >= totalPages) return;
    ADMIN_PAGE_STATE.page += 1;
    await refreshAdminPage();
}

async function handleAdminSaveProfile(userId) {
    try {
        await window.AdminService.updateUserProfile({
            targetUserId: userId,
            username: document.getElementById(`adminUsername-${userId}`)?.value || '',
            fullName: document.getElementById(`adminFullName-${userId}`)?.value || '',
            bio: document.getElementById(`adminBio-${userId}`)?.value || '',
            isPublic: Boolean(document.getElementById(`adminIsPublic-${userId}`)?.checked)
        });
        showToast(t('profile_updated'), 'success');
        await refreshAdminPage();
    } catch (error) {
        console.error('Admin update profile failed', error);
        showToast(t('admin_operation_failed'), 'error');
    }
}

async function handleAdminToggleBlock(userId, isCurrentlyBlocked) {
    try {
        let reason = '';
        if (!isCurrentlyBlocked) {
            reason = window.prompt(t('admin_block_reason_prompt')) || '';
        }

        await window.AdminService.setBlockStatus({
            targetUserId: userId,
            blocked: !isCurrentlyBlocked,
            reason
        });

        showToast(!isCurrentlyBlocked ? t('admin_block_success') : t('admin_unblock_success'), 'success');
        await refreshAdminPage();
    } catch (error) {
        console.error('Admin set block failed', error);
        showToast(t('admin_operation_failed'), 'error');
    }
}

async function handleAdminDeleteUser(userId) {
    const confirmed = window.confirm(t('admin_delete_confirm'));
    if (!confirmed) return;

    try {
        await window.AdminService.deleteUser(userId);
        showToast(t('admin_delete_success'), 'success');
        await refreshAdminPage();
    } catch (error) {
        console.error('Admin delete user failed', error);
        showToast(t('admin_operation_failed'), 'error');
    }
}

async function handleAdminNotifyUser(userId) {
    const title = window.prompt(t('admin_notification_title_prompt')) || '';
    if (!title.trim()) return;
    const body = window.prompt(t('admin_notification_body_prompt')) || '';
    if (!body.trim()) return;

    try {
        await window.AdminService.sendNotificationToUser({
            targetUserId: userId,
            title: title.trim(),
            body: body.trim(),
            url: '/'
        });
        showToast(t('admin_notification_sent'), 'success');
        await refreshAdminPage();
    } catch (error) {
        console.error('Admin send single notification failed', error);
        showToast(t('admin_operation_failed'), 'error');
    }
}

async function handleAdminBroadcast() {
    const title = document.getElementById('adminBroadcastTitle')?.value?.trim() || '';
    const body = document.getElementById('adminBroadcastBody')?.value?.trim() || '';
    const url = document.getElementById('adminBroadcastUrl')?.value?.trim() || '/';

    if (!title || !body) {
        showToast(t('error_invalid_input'), 'error');
        return;
    }

    try {
        await window.AdminService.broadcastNotification({ title, body, url });
        showToast(t('admin_broadcast_sent'), 'success');
        document.getElementById('adminBroadcastTitle').value = '';
        document.getElementById('adminBroadcastBody').value = '';
        await refreshAdminPage();
    } catch (error) {
        console.error('Admin broadcast failed', error);
        showToast(t('admin_operation_failed'), 'error');
    }
}

window.renderAdminPage = renderAdminPage;
