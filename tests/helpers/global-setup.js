process.env.TZ = 'UTC';

if (!globalThis.crypto) {
    globalThis.crypto = {
        randomUUID: () => '00000000-0000-4000-8000-000000000000'
    };
} else if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}
