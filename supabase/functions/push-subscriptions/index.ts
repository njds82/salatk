import { corsHeaders, withCors } from '../_shared/cors.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/auth.ts';

const VALID_ACTIONS = new Set(['upsert', 'remove']);

function jsonResponse(status: number, body: Record<string, unknown>) {
    return withCors(new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    }));
}

function sanitizeSubscriptionBody(value: unknown) {
    if (!value || typeof value !== 'object') return null;
    const payload = value as Record<string, unknown>;

    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint.trim() : '';
    const p256dh = typeof payload.p256dh === 'string' ? payload.p256dh.trim() : '';
    const authKey = typeof payload.auth_key === 'string' ? payload.auth_key.trim() : '';

    if (!endpoint || !p256dh || !authKey) return null;
    return {
        endpoint: endpoint.slice(0, 2000),
        p256dh: p256dh.slice(0, 500),
        auth_key: authKey.slice(0, 500)
    };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse(405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }

    try {
        const auth = await requireAuthenticatedUser(req);
        const adminClient = createServiceClient();
        const body = await req.json() as Record<string, unknown>;
        const action = typeof body.action === 'string' ? body.action : '';

        if (!VALID_ACTIONS.has(action)) {
            return jsonResponse(400, { ok: false, code: 'INVALID_ACTION', message: 'Invalid action' });
        }

        if (action === 'upsert') {
            const subscription = sanitizeSubscriptionBody(body.subscription);
            if (!subscription) {
                return jsonResponse(400, {
                    ok: false,
                    code: 'INVALID_SUBSCRIPTION',
                    message: 'Subscription payload is invalid'
                });
            }

            const { error } = await adminClient
                .from('user_push_subscriptions')
                .upsert({
                    user_id: auth.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.p256dh,
                    auth_key: subscription.auth_key,
                    is_active: true,
                    last_seen_at: new Date().toISOString()
                }, {
                    onConflict: 'endpoint'
                });

            if (error) throw error;

            return jsonResponse(200, { ok: true, data: { action: 'upserted' } });
        }

        const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
        if (!endpoint) {
            return jsonResponse(400, {
                ok: false,
                code: 'INVALID_SUBSCRIPTION_ENDPOINT',
                message: 'Endpoint is required'
            });
        }

        const { error } = await adminClient
            .from('user_push_subscriptions')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', auth.user.id)
            .eq('endpoint', endpoint);

        if (error) throw error;

        return jsonResponse(200, { ok: true, data: { action: 'removed' } });
    } catch (error) {
        const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        const statusCode = code === 'UNAUTHORIZED' || code === 'AUTH_TOKEN_MISSING' ? 401 : 400;
        return jsonResponse(statusCode, { ok: false, code, message: 'Push subscription operation failed' });
    }
});

