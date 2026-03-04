import { corsHeaders, withCors } from '../_shared/cors.ts';
import { createServiceClient, requireAdminUser } from '../_shared/auth.ts';

const ADMIN_ACTIONS = new Set(['list', 'update_profile', 'set_block', 'delete_user']);

function jsonResponse(status: number, body: Record<string, unknown>) {
    return withCors(new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    }));
}

function isUuid(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeShortText(value: unknown, maxLen: number): string | null {
    if (typeof value !== 'string') return null;
    const clean = value.trim();
    if (!clean) return null;
    return clean.slice(0, maxLen);
}

function normalizeUsername(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const clean = value.trim().toLowerCase().replace(/^@+/, '');
    if (!/^[a-z0-9_]{3,32}$/.test(clean)) return null;
    return clean;
}

async function writeAuditLog(
    adminClient: ReturnType<typeof createServiceClient>,
    params: {
        adminUserId: string;
        action: string;
        targetUserId?: string | null;
        status: 'success' | 'error';
        metadata?: Record<string, unknown>;
        errorMessage?: string | null;
    }
) {
    await adminClient.from('admin_audit_logs').insert({
        admin_user_id: params.adminUserId,
        action: params.action,
        target_user_id: params.targetUserId ?? null,
        status: params.status,
        metadata: params.metadata ?? {},
        error_message: params.errorMessage ?? null
    });
}

function parsePagination(rawPage: unknown, rawSize: unknown) {
    const page = Math.max(1, Number(rawPage) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(rawSize) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { page, pageSize, from, to };
}

async function ensureTargetIsNotProtected(
    adminClient: ReturnType<typeof createServiceClient>,
    actorUserId: string,
    targetUserId: string
) {
    if (actorUserId === targetUserId) {
        throw new Error('CANNOT_TARGET_SELF');
    }

    const { data: targetAdmin, error } = await adminClient
        .from('admin_users')
        .select('user_id,is_active')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) throw error;
    if (targetAdmin) {
        throw new Error('CANNOT_TARGET_ACTIVE_ADMIN');
    }
}

async function handleListUsers(
    adminClient: ReturnType<typeof createServiceClient>,
    body: Record<string, unknown>
) {
    const { page, pageSize, from, to } = parsePagination(body.page, body.page_size);
    const filter = typeof body.filter === 'string' ? body.filter : 'all';
    const rawSearch = typeof body.search === 'string' ? body.search.trim() : '';
    const search = rawSearch.replace(/[%*,]/g, ' ').slice(0, 60);

    let query = adminClient
        .from('admin_user_directory')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (search) {
        query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (filter === 'blocked') {
        query = query.eq('is_blocked', true);
    } else if (filter === 'active') {
        query = query.eq('is_blocked', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        users: data ?? [],
        page,
        page_size: pageSize,
        total: count ?? 0
    };
}

async function handleUpdateProfile(
    adminClient: ReturnType<typeof createServiceClient>,
    body: Record<string, unknown>
) {
    const targetUserId = body.target_user_id;
    if (!isUuid(targetUserId)) {
        throw new Error('INVALID_TARGET_USER');
    }

    const updates: Record<string, unknown> = {};
    const userMetadataUpdates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'username')) {
        const username = normalizeUsername(body.username);
        if (!username) throw new Error('INVALID_USERNAME');
        updates.username = username;
        userMetadataUpdates.username = username;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'full_name')) {
        const fullName = sanitizeShortText(body.full_name, 120);
        updates.full_name = fullName;
        userMetadataUpdates.full_name = fullName;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
        const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) : '';
        updates.bio = bio || null;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'is_public')) {
        if (typeof body.is_public !== 'boolean') throw new Error('INVALID_VISIBILITY');
        updates.is_public = body.is_public;
    }

    if (Object.keys(updates).length === 0) {
        throw new Error('NO_UPDATES_PROVIDED');
    }

    const profilePayload = {
        id: targetUserId,
        ...updates,
        updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .upsert(profilePayload)
        .select('*')
        .single();

    if (profileError) throw profileError;

    if (Object.keys(userMetadataUpdates).length > 0) {
        const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(targetUserId);
        if (authUserError) throw authUserError;

        const nextMeta = {
            ...(authUser.user?.user_metadata || {}),
            ...userMetadataUpdates
        };

        const { error: updateMetaError } = await adminClient.auth.admin.updateUserById(targetUserId, {
            user_metadata: nextMeta
        });
        if (updateMetaError) throw updateMetaError;
    }

    return { profile };
}

async function handleSetBlock(
    adminClient: ReturnType<typeof createServiceClient>,
    actorUserId: string,
    body: Record<string, unknown>
) {
    const targetUserId = body.target_user_id;
    if (!isUuid(targetUserId)) throw new Error('INVALID_TARGET_USER');
    if (typeof body.blocked !== 'boolean') throw new Error('INVALID_BLOCK_VALUE');

    await ensureTargetIsNotProtected(adminClient, actorUserId, targetUserId);

    const blocked = body.blocked;
    const reason = sanitizeShortText(body.reason, 240);

    if (blocked) {
        const { error: statusError } = await adminClient
            .from('user_access_status')
            .upsert({
                user_id: targetUserId,
                is_blocked: true,
                blocked_reason: reason,
                blocked_by: actorUserId,
                blocked_at: new Date().toISOString()
            });
        if (statusError) throw statusError;

        const { error: banError } = await adminClient.auth.admin.updateUserById(targetUserId, {
            ban_duration: '876000h'
        });
        if (banError) throw banError;

        // Best-effort signout. Some Supabase versions expose admin.signOut(userId).
        try {
            const authAdmin = adminClient.auth.admin as unknown as { signOut?: (...args: unknown[]) => Promise<unknown> };
            if (typeof authAdmin.signOut === 'function') {
                await authAdmin.signOut(targetUserId);
            }
        } catch (_) {
            // Keep this best-effort only.
        }
    } else {
        const { error: statusError } = await adminClient
            .from('user_access_status')
            .upsert({
                user_id: targetUserId,
                is_blocked: false,
                blocked_reason: null,
                blocked_by: null,
                blocked_at: null
            });
        if (statusError) throw statusError;

        const { error: unbanError } = await adminClient.auth.admin.updateUserById(targetUserId, {
            ban_duration: 'none'
        });
        if (unbanError) throw unbanError;
    }

    return { target_user_id: targetUserId, blocked };
}

async function handleDeleteUser(
    adminClient: ReturnType<typeof createServiceClient>,
    actorUserId: string,
    body: Record<string, unknown>
) {
    const targetUserId = body.target_user_id;
    if (!isUuid(targetUserId)) throw new Error('INVALID_TARGET_USER');
    if (body.confirm !== 'DELETE') throw new Error('DELETE_CONFIRMATION_REQUIRED');

    await ensureTargetIsNotProtected(adminClient, actorUserId, targetUserId);

    const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (error) throw error;

    return { target_user_id: targetUserId, deleted: true };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse(405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }

    let adminUserId = '';
    let action = '';

    try {
        const auth = await requireAdminUser(req);
        adminUserId = auth.user.id;
        const adminClient = createServiceClient();

        const body = await req.json() as Record<string, unknown>;
        action = typeof body.action === 'string' ? body.action : '';
        if (!ADMIN_ACTIONS.has(action)) {
            return jsonResponse(400, { ok: false, code: 'INVALID_ACTION', message: 'Invalid action' });
        }

        let data: Record<string, unknown>;
        if (action === 'list') {
            data = await handleListUsers(adminClient, body);
        } else if (action === 'update_profile') {
            data = await handleUpdateProfile(adminClient, body);
        } else if (action === 'set_block') {
            data = await handleSetBlock(adminClient, adminUserId, body);
        } else {
            data = await handleDeleteUser(adminClient, adminUserId, body);
        }

        await writeAuditLog(adminClient, {
            adminUserId,
            action,
            targetUserId: isUuid(body.target_user_id) ? body.target_user_id : null,
            status: 'success',
            metadata: data
        });

        return jsonResponse(200, { ok: true, data });
    } catch (error) {
        const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        const message = code === 'FORBIDDEN'
            ? 'Admin permission required'
            : code === 'UNAUTHORIZED' || code === 'AUTH_TOKEN_MISSING'
                ? 'Unauthorized'
                : 'Operation failed';

        if (adminUserId && action) {
            const adminClient = createServiceClient();
            await writeAuditLog(adminClient, {
                adminUserId,
                action,
                status: 'error',
                errorMessage: code
            });
        }

        const statusCode = code === 'FORBIDDEN'
            ? 403
            : (code === 'UNAUTHORIZED' || code === 'AUTH_TOKEN_MISSING')
                ? 401
                : 400;

        return jsonResponse(statusCode, { ok: false, code, message });
    }
});

