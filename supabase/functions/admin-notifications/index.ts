import webpush from 'npm:web-push@3.6.7';
import { corsHeaders, withCors } from '../_shared/cors.ts';
import { createServiceClient, requireAdminUser } from '../_shared/auth.ts';

const MAX_BROADCAST_RECIPIENTS = 500;
const VALID_ACTIONS = new Set(['send_single', 'send_broadcast']);

const VAPID_PUBLIC_KEY = Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('WEB_PUSH_SUBJECT') || '';

const HAS_PUSH_CONFIG = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);
if (HAS_PUSH_CONFIG) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

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

function cleanText(value: unknown, maxLen: number): string | null {
    if (typeof value !== 'string') return null;
    const clean = value.trim();
    if (!clean) return null;
    return clean.slice(0, maxLen);
}

function chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
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

async function sendToUser(
    adminClient: ReturnType<typeof createServiceClient>,
    params: {
        userId: string;
        title: string;
        body: string;
        url?: string | null;
    }
) {
    const payload = {
        title: params.title,
        body: params.body,
        url: params.url || '/',
        source: 'admin',
        created_at: new Date().toISOString()
    };

    const { data: subscriptions, error: subscriptionError } = await adminClient
        .from('user_push_subscriptions')
        .select('id,endpoint,p256dh,auth_key')
        .eq('user_id', params.userId)
        .eq('is_active', true);

    if (subscriptionError) throw subscriptionError;

    let pushSuccessCount = 0;

    if (HAS_PUSH_CONFIG && subscriptions && subscriptions.length > 0) {
        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth_key
                    }
                }, JSON.stringify(payload));
                pushSuccessCount += 1;
            } catch (error) {
                const statusCode = (error as { statusCode?: number })?.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    await adminClient
                        .from('user_push_subscriptions')
                        .update({ is_active: false })
                        .eq('id', subscription.id);
                }
            }
        }
    }

    const shouldFallbackInApp = pushSuccessCount === 0;
    if (shouldFallbackInApp) {
        const { error: fallbackError } = await adminClient
            .from('user_notifications')
            .insert({
                user_id: params.userId,
                title: params.title,
                body: params.body,
                payload: { url: params.url || '/', source: 'admin' },
                source: 'admin'
            });
        if (fallbackError) throw fallbackError;
    }

    return {
        user_id: params.userId,
        subscriptions: subscriptions?.length || 0,
        push_success_count: pushSuccessCount,
        fallback_in_app: shouldFallbackInApp
    };
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
    let targetUserId: string | null = null;

    try {
        const auth = await requireAdminUser(req);
        adminUserId = auth.user.id;
        const adminClient = createServiceClient();

        const body = await req.json() as Record<string, unknown>;
        action = typeof body.action === 'string' ? body.action : '';
        if (!VALID_ACTIONS.has(action)) {
            return jsonResponse(400, { ok: false, code: 'INVALID_ACTION', message: 'Invalid action' });
        }

        const title = cleanText(body.title, 120);
        const messageBody = cleanText(body.body, 1000);
        const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '/';

        if (!title || !messageBody) {
            return jsonResponse(400, { ok: false, code: 'INVALID_NOTIFICATION_PAYLOAD', message: 'Title and body are required' });
        }

        if (action === 'send_single') {
            if (!isUuid(body.target_user_id)) {
                return jsonResponse(400, { ok: false, code: 'INVALID_TARGET_USER', message: 'Invalid target user' });
            }
            targetUserId = body.target_user_id;

            const delivery = await sendToUser(adminClient, {
                userId: targetUserId,
                title,
                body: messageBody,
                url
            });

            await writeAuditLog(adminClient, {
                adminUserId,
                action,
                targetUserId,
                status: 'success',
                metadata: delivery
            });

            return jsonResponse(200, { ok: true, data: delivery });
        }

        const { data: recipients, error: recipientError } = await adminClient
            .from('admin_user_directory')
            .select('user_id')
            .eq('is_blocked', false)
            .limit(MAX_BROADCAST_RECIPIENTS);

        if (recipientError) throw recipientError;
        const recipientIds = (recipients || []).map((row) => row.user_id).filter(Boolean) as string[];

        const chunked = chunk(recipientIds, 20);
        const deliveries: Array<Record<string, unknown>> = [];

        for (const batch of chunked) {
            const batchResults = await Promise.all(batch.map((userId) => sendToUser(adminClient, {
                userId,
                title,
                body: messageBody,
                url
            })));
            deliveries.push(...batchResults);
        }

        const summary = {
            recipients: recipientIds.length,
            delivered_push: deliveries.filter((item) => Number(item.push_success_count || 0) > 0).length,
            fallback_in_app: deliveries.filter((item) => item.fallback_in_app === true).length,
            push_configured: HAS_PUSH_CONFIG
        };

        await writeAuditLog(adminClient, {
            adminUserId,
            action,
            status: 'success',
            metadata: summary
        });

        return jsonResponse(200, { ok: true, data: summary });
    } catch (error) {
        const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        const statusCode = code === 'FORBIDDEN'
            ? 403
            : (code === 'UNAUTHORIZED' || code === 'AUTH_TOKEN_MISSING')
                ? 401
                : 400;

        if (adminUserId && action) {
            const adminClient = createServiceClient();
            await writeAuditLog(adminClient, {
                adminUserId,
                action,
                targetUserId,
                status: 'error',
                errorMessage: code
            });
        }

        return jsonResponse(statusCode, { ok: false, code, message: 'Notification operation failed' });
    }
});

