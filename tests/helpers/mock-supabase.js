function compare(op, left, right) {
    if (op === 'eq') return left === right;
    if (op === 'neq') return left !== right;
    if (op === 'gt') return left > right;
    if (op === 'gte') return left >= right;
    if (op === 'lt') return left < right;
    if (op === 'lte') return left <= right;
    if (op === 'in') return Array.isArray(right) && right.includes(left);
    if (op === 'is') return right === null ? left === null || typeof left === 'undefined' : left === right;
    return true;
}

function applyFilters(rows, filters) {
    return rows.filter((row) => {
        return filters.every(({ op, key, value }) => compare(op, row[key], value));
    });
}

function applyOrdering(rows, orderBy) {
    if (!orderBy) return rows;
    const { key, ascending } = orderBy;

    return [...rows].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        if (ascending === false) return av > bv ? -1 : 1;
        return av > bv ? 1 : -1;
    });
}

function createQuery(client, tableName) {
    const state = {
        op: 'select',
        table: tableName,
        payload: null,
        conflict: null,
        filters: [],
        orderBy: null,
        maxRows: null,
        shouldSingle: false,
        shouldMaybeSingle: false
    };

    const query = {
        select: () => {
            state.op = state.op === 'select' ? 'select' : state.op;
            return query;
        },
        insert: (payload) => {
            state.op = 'insert';
            state.payload = payload;
            return query;
        },
        update: (payload) => {
            state.op = 'update';
            state.payload = payload;
            return query;
        },
        upsert: (payload, options = {}) => {
            state.op = 'upsert';
            state.payload = payload;
            state.conflict = options.onConflict || null;
            return query;
        },
        delete: () => {
            state.op = 'delete';
            return query;
        },
        eq: (key, value) => {
            state.filters.push({ op: 'eq', key, value });
            return query;
        },
        neq: (key, value) => {
            state.filters.push({ op: 'neq', key, value });
            return query;
        },
        gt: (key, value) => {
            state.filters.push({ op: 'gt', key, value });
            return query;
        },
        gte: (key, value) => {
            state.filters.push({ op: 'gte', key, value });
            return query;
        },
        lt: (key, value) => {
            state.filters.push({ op: 'lt', key, value });
            return query;
        },
        lte: (key, value) => {
            state.filters.push({ op: 'lte', key, value });
            return query;
        },
        in: (key, value) => {
            state.filters.push({ op: 'in', key, value });
            return query;
        },
        is: (key, value) => {
            state.filters.push({ op: 'is', key, value });
            return query;
        },
        order: (key, { ascending = true } = {}) => {
            state.orderBy = { key, ascending };
            return query;
        },
        limit: (count) => {
            state.maxRows = count;
            return query;
        },
        single: async () => {
            state.shouldSingle = true;
            return execute();
        },
        maybeSingle: async () => {
            state.shouldMaybeSingle = true;
            return execute();
        },
        then: (resolve, reject) => execute().then(resolve, reject),
        catch: (reject) => execute().catch(reject),
        finally: (finalizer) => execute().finally(finalizer)
    };

    function findConflictKey(row, rows) {
        if (state.conflict) {
            const keys = state.conflict.split(',').map((item) => item.trim());
            const existing = rows.find((candidate) => keys.every((key) => candidate[key] === row[key]));
            return existing;
        }

        if (typeof row.id !== 'undefined') {
            return rows.find((candidate) => candidate.id === row.id);
        }

        return null;
    }

    async function execute() {
        const table = client.__tables[state.table] || [];
        let rows = [...table];

        if (state.op === 'select') {
            rows = applyFilters(rows, state.filters);
            rows = applyOrdering(rows, state.orderBy);
            if (typeof state.maxRows === 'number') rows = rows.slice(0, state.maxRows);

            if (state.shouldSingle) {
                return { data: rows[0] || null, error: rows.length > 1 ? { message: 'Multiple rows found' } : null };
            }

            if (state.shouldMaybeSingle) {
                return { data: rows[0] || null, error: null };
            }

            return { data: rows, error: null };
        }

        if (state.op === 'insert') {
            const payloadRows = Array.isArray(state.payload) ? state.payload : [state.payload];
            for (const row of payloadRows) {
                table.push({ ...row });
            }
            client.__tables[state.table] = table;
            const inserted = payloadRows.map((row) => ({ ...row }));
            const data = state.shouldSingle ? inserted[0] : inserted;
            return { data, error: null };
        }

        if (state.op === 'update') {
            const filtered = applyFilters(rows, state.filters);
            for (const target of filtered) {
                Object.assign(target, state.payload || {});
            }
            const data = state.shouldSingle ? filtered[0] || null : filtered;
            return { data, error: null };
        }

        if (state.op === 'delete') {
            const toDelete = applyFilters(rows, state.filters);
            client.__tables[state.table] = rows.filter((row) => !toDelete.includes(row));
            const data = state.shouldSingle ? toDelete[0] || null : toDelete;
            return { data, error: null };
        }

        if (state.op === 'upsert') {
            const payloadRows = Array.isArray(state.payload) ? state.payload : [state.payload];
            const output = [];

            for (const payload of payloadRows) {
                const existing = findConflictKey(payload, table);
                if (existing) {
                    Object.assign(existing, payload);
                    output.push({ ...existing });
                } else {
                    table.push({ ...payload });
                    output.push({ ...payload });
                }
            }

            client.__tables[state.table] = table;
            const data = state.shouldSingle ? output[0] || null : output;
            return { data, error: null };
        }

        return { data: null, error: null };
    }

    return query;
}

export function createMockSupabaseClient(options = {}) {
    const session = options.session || {
        user: { id: 'test-user-id', email: 'test@salatk.local' }
    };

    const client = {
        __tables: { ...(options.tables || {}) },
        __session: session,
        auth: {
            async signUp({ email }) {
                return {
                    data: {
                        session,
                        user: { id: session.user.id, email }
                    },
                    error: null
                };
            },
            async signInWithPassword({ email }) {
                return {
                    data: {
                        session,
                        user: { id: session.user.id, email }
                    },
                    error: null
                };
            },
            async signOut() {
                return { error: null };
            },
            async getSession() {
                return { data: { session: client.__session }, error: null };
            },
            async getUser() {
                return { data: { user: client.__session ? client.__session.user : null }, error: null };
            },
            async updateUser() {
                return { error: null };
            },
            onAuthStateChange() {
                return { data: { subscription: { unsubscribe: () => { } } } };
            },
            session() {
                return client.__session;
            }
        },
        from(tableName) {
            if (!client.__tables[tableName]) {
                client.__tables[tableName] = [];
            }
            return createQuery(client, tableName);
        },
        channel() {
            return {
                on() {
                    return this;
                },
                subscribe() {
                    return {
                        unsubscribe: () => { }
                    };
                }
            };
        }
    };

    return client;
}

export function setMockSession(client, session) {
    client.__session = session;
}
