// ========================================
// Database Connection & Sync Test Script
// ========================================
// This script can be run in the browser console to test database connectivity

console.log('🔍 Starting Database Connection Tests...\n');

// Test 1: Check Supabase Client
async function testSupabaseConnection() {
    console.log('Test 1: Supabase Connection');
    console.log('----------------------------');

    if (!window.supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return false;
    }

    console.log('✅ Supabase client initialized');
    console.log('   URL:', window.supabaseClient.supabaseUrl);

    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error) {
            console.error('❌ Auth error:', error.message);
            return false;
        }

        if (session) {
            console.log('✅ User authenticated');
            console.log('   User ID:', session.user.id);
            console.log('   Email:', session.user.email);
        } else {
            console.warn('⚠️  No active session - user not logged in');
        }

        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
}

// Test 2: Check IndexedDB
async function testIndexedDB() {
    console.log('\nTest 2: IndexedDB');
    console.log('----------------------------');

    if (!window.db) {
        console.error('❌ IndexedDB not initialized');
        return false;
    }

    console.log('✅ IndexedDB initialized');
    console.log('   Database:', window.db.name);
    console.log('   Tables:', window.db.tables.map(t => t.name).join(', '));

    try {
        // Count records in each table
        const prayers = await db.prayers.count();
        const habits = await db.habits.count();
        const points = await db.points.count();
        const qada = await db.qada.count();
        const settings = await db.settings.count();

        console.log('   Records:');
        console.log('     - Prayers:', prayers);
        console.log('     - Habits:', habits);
        console.log('     - Points:', points);
        console.log('     - Qada:', qada);
        console.log('     - Settings:', settings);

        return true;
    } catch (error) {
        console.error('❌ IndexedDB test failed:', error);
        return false;
    }
}

// Test 3: Check Services
function testServices() {
    console.log('\nTest 3: Services Availability');
    console.log('----------------------------');

    const services = {
        'SyncManager': window.SyncManager,
        'PrayerService': window.PrayerService,
        'HabitService': window.HabitService,
        'PointsService': window.PointsService,
        'SettingsService': window.SettingsService
    };

    let allAvailable = true;

    for (const [name, service] of Object.entries(services)) {
        if (service) {
            console.log(`✅ ${name} available`);
        } else {
            console.error(`❌ ${name} not available`);
            allAvailable = false;
        }
    }

    return allAvailable;
}

// Test 4: Test Data Sync (Push & Pull)
async function testDataSync() {
    console.log('\nTest 4: Data Synchronization');
    console.log('----------------------------');

    if (!window.SyncManager) {
        console.error('❌ SyncManager not available');
        return false;
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (!session) {
            console.warn('⚠️  Cannot test sync - user not logged in');
            return false;
        }

        console.log('Testing Pull (Cloud → Local)...');
        const pullResult = await SyncManager.pullAllData();

        if (pullResult) {
            console.log('✅ Pull successful');
        } else {
            console.error('❌ Pull failed');
        }

        // Check if we have data in Supabase
        console.log('\nChecking Supabase tables...');

        const tables = [
            'user_settings',
            'prayer_records',
            'habits',
            'habit_history',
            'points_history',
            'qada_prayers',
            'locations'
        ];

        for (const table of tables) {
            try {
                const { data, error, count } = await window.supabaseClient
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id);

                if (error) {
                    console.error(`❌ ${table}: Error - ${error.message}`);
                } else {
                    console.log(`✅ ${table}: ${count || 0} records`);
                }
            } catch (err) {
                console.error(`❌ ${table}: ${err.message}`);
            }
        }

        return pullResult;
    } catch (error) {
        console.error('❌ Sync test failed:', error);
        return false;
    }
}

// Test 5: Test RLS Policies
async function testRLS() {
    console.log('\nTest 5: Row Level Security');
    console.log('----------------------------');

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (!session) {
            console.warn('⚠️  Cannot test RLS - user not logged in');
            return false;
        }

        // Try to read user's own settings
        const { data, error } = await window.supabaseClient
            .from('user_settings')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            console.error('❌ RLS test failed:', error.message);
            return false;
        }

        console.log('✅ RLS working correctly - can access own data');
        console.log('   Settings:', data);

        return true;
    } catch (error) {
        console.error('❌ RLS test failed:', error);
        return false;
    }
}

// Test 6: Test Real-time Updates
async function testRealtimeUpdate() {
    console.log('\nTest 6: Real-time Data Update');
    console.log('----------------------------');

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (!session) {
            console.warn('⚠️  Cannot test updates - user not logged in');
            return false;
        }

        // Test updating settings
        console.log('Testing settings update...');
        const testValue = `test_${Date.now()}`;

        const { error: updateError } = await window.supabaseClient
            .from('user_settings')
            .upsert({
                user_id: session.user.id,
                language: 'ar',
                theme: 'light',
                last_visit: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            });

        if (updateError) {
            console.error('❌ Update failed:', updateError.message);
            return false;
        }

        console.log('✅ Settings updated successfully');

        // Verify the update
        const { data, error: readError } = await window.supabaseClient
            .from('user_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (readError) {
            console.error('❌ Read after update failed:', readError.message);
            return false;
        }

        console.log('✅ Verified update:', data);

        return true;
    } catch (error) {
        console.error('❌ Update test failed:', error);
        return false;
    }
}

// Run All Tests
async function runAllDatabaseTests() {
    console.log('═══════════════════════════════════════');
    console.log('  DATABASE CONNECTION & SYNC TESTS');
    console.log('═══════════════════════════════════════\n');

    const results = {
        supabase: await testSupabaseConnection(),
        indexeddb: await testIndexedDB(),
        services: testServices(),
        sync: await testDataSync(),
        rls: await testRLS(),
        updates: await testRealtimeUpdate()
    };

    console.log('\n═══════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════');

    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

    if (passed === total) {
        console.log('🎉 All tests passed! Database connection is working perfectly.');
    } else {
        console.warn('⚠️  Some tests failed. Please check the errors above.');
    }

    return results;
}

// Export for use
window.runDatabaseTests = runAllDatabaseTests;

// Auto-run if this script is loaded
console.log('Database test script loaded. Run runDatabaseTests() to start testing.\n');
