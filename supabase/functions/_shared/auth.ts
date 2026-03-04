import { createClient } from 'npm:@supabase/supabase-js@2';

type AuthContext = {
    user: { id: string };
    userClient: ReturnType<typeof createClient>;
};

function getBearerToken(req: Request): string | null {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    return token || null;
}

function createUserClient(req: Request) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                Authorization: req.headers.get('Authorization') || ''
            }
        }
    });
}

export function createServiceClient() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function requireAuthenticatedUser(req: Request): Promise<AuthContext> {
    const token = getBearerToken(req);
    if (!token) {
        throw new Error('AUTH_TOKEN_MISSING');
    }

    const userClient = createUserClient(req);
    const { data, error } = await userClient.auth.getUser(token);
    if (error || !data.user) {
        throw new Error('UNAUTHORIZED');
    }

    return {
        user: { id: data.user.id },
        userClient
    };
}

export async function requireAdminUser(req: Request): Promise<AuthContext> {
    const auth = await requireAuthenticatedUser(req);
    const { data, error } = await auth.userClient.rpc('is_current_user_admin');

    if (error || data !== true) {
        throw new Error('FORBIDDEN');
    }

    return auth;
}

