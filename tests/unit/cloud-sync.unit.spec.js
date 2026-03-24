import { createBootstrappedWindow } from '../helpers/bootstrap.js';

describe('Cloud-synced variable feature', () => {
    it('hydrates variable links from cloud and migrates legacy local cache', async () => {
        const cloudRows = [
            {
                id: 'link-1',
                user_id: 'test-user-id',
                variable: 'LINK',
                element_type: 'prayer',
                element_id: 'fajr',
                trigger_value: 'done',
                created_at: '2026-03-24T00:00:00Z',
                updated_at: '2026-03-24T00:00:00Z'
            }
        ];

        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/variable-service.js'],
            supabase: {
                tables: {
                    variable_links: cloudRows
                }
            }
        });

        window.localStorage.setItem('salatk_variable_links', JSON.stringify([
            {
                variable: 'OLD',
                elementType: 'habit',
                elementId: 'habit-1',
                trigger: 'done'
            }
        ]));

        await window.VariableService.init();

        expect(window.VariableService.getForElement('prayer', 'fajr')).toMatchObject({
            variable: 'LINK',
            elementType: 'prayer',
            elementId: 'fajr',
            trigger: 'done'
        });

        expect(window.supabaseClient.__tables.variable_links).toHaveLength(1);
        expect(window.localStorage.getItem('salatk_variable_links')).toBeNull();
        expect(JSON.parse(window.localStorage.getItem('salatk_variable_links:test-user-id') || '[]')).toEqual([
            expect.objectContaining({
                variable: 'LINK',
                elementType: 'prayer',
                elementId: 'fajr',
                trigger: 'done'
            })
        ]);

        cleanup();
    });

    it('syncs variable link updates to the cloud table', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/variable-service.js'],
            supabase: {
                tables: {
                    variable_links: []
                }
            }
        });

        await window.VariableService.init();
        const saveResult = await window.VariableService.set('LINK', 'habit', 'habit-1', 'done');

        expect(saveResult).toMatchObject({
            success: true,
            synced: true
        });
        expect(window.supabaseClient.__tables.variable_links).toHaveLength(1);
        expect(window.supabaseClient.__tables.variable_links[0]).toMatchObject({
            user_id: 'test-user-id',
            variable: 'LINK',
            element_type: 'habit',
            element_id: 'habit-1',
            trigger_value: 'done'
        });

        const removeResult = await window.VariableService.remove('habit', 'habit-1');
        expect(removeResult).toMatchObject({
            success: true,
            synced: true
        });
        expect(window.supabaseClient.__tables.variable_links).toHaveLength(0);

        cleanup();
    });

    it('refreshes variable-linked pages after realtime cloud updates', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/variable-service.js',
                'js/sync-manager.js'
            ]
        });

        window.currentPage = 'daily-prayers';
        window.renderPage = vi.fn().mockResolvedValue();
        window.VariableService.init = vi.fn().mockResolvedValue([]);

        await window.SyncManager.handleRealtimeEvent({
            table: 'variable_links',
            eventType: 'UPDATE',
            new: {
                user_id: 'test-user-id'
            }
        });

        expect(window.VariableService.init).toHaveBeenCalledWith({ force: true });
        expect(window.renderPage).toHaveBeenCalledWith('daily-prayers', true);

        window.renderPage.mockReset();
        window.currentPage = 'time-management';

        await window.SyncManager.handleRealtimeEvent({
            table: 'time_plans',
            eventType: 'UPDATE',
            new: {
                user_id: 'test-user-id'
            }
        });

        expect(window.renderPage).toHaveBeenCalledWith('time-management', true);

        cleanup();
    });

    it('syncs time plan completion to the cloud and keeps the fallback cache aligned', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: ['js/services/time-plan-service.js'],
            supabase: {
                tables: {
                    time_plans: [
                        {
                            id: 'plan-1',
                            user_id: 'test-user-id',
                            scope: 'daily',
                            date: '2026-03-24',
                            weekday: null,
                            title: 'Focus block',
                            notes: null,
                            start_time: '08:00',
                            end_time: '09:00',
                            is_done: false,
                            done_at: null
                        }
                    ]
                }
            }
        });

        await window.TimePlanService.setPlanDone('plan-1', true);

        expect(window.supabaseClient.__tables.time_plans[0]).toMatchObject({
            id: 'plan-1',
            user_id: 'test-user-id',
            is_done: true
        });
        expect(window.TimePlanService.getPlanDoneState('plan-1')).toBe(true);

        await window.TimePlanService.setPlanDone('plan-1', false);

        expect(window.supabaseClient.__tables.time_plans[0]).toMatchObject({
            id: 'plan-1',
            user_id: 'test-user-id',
            is_done: false,
            done_at: null
        });
        expect(window.TimePlanService.getPlanDoneState('plan-1')).toBe(false);

        cleanup();
    });
});
