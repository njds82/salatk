import { createBootstrappedWindow } from '../helpers/bootstrap.js';

describe('Variable links', () => {
    it('applies linked actions across prayers, habits, and time plans', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/variable-service.js',
                'js/variable-manager.js'
            ]
        });

        const prayerMark = vi.fn().mockResolvedValue({ success: true });
        const habitLog = vi.fn().mockResolvedValue(undefined);

        window.showToast = vi.fn();
        window.PrayerService = { markPrayer: prayerMark };
        window.HabitService = { logAction: habitLog };

        const linkedTargets = [
            { variable: 'LINK', elementType: 'prayer', elementId: 'prayer-target', trigger: 'done' },
            { variable: 'LINK', elementType: 'habit', elementId: 'habit-target', trigger: 'done' },
            { variable: 'LINK', elementType: 'timeplan', elementId: 'plan-target', trigger: 'done' }
        ];

        window.VariableService.getLinkedElements = vi.fn(() => linkedTargets);
        window.VariableService.getForElement = vi.fn(() => null);

        const result = await window.VariableManager.activate('LINK', 'prayer', 'source-prayer', 'done', {
            date: '2026-03-24'
        });

        expect(prayerMark).toHaveBeenCalledWith('prayer-target', '2026-03-24', 'done');
        expect(habitLog).toHaveBeenCalledWith('habit-target', '2026-03-24', 'done');
        expect(JSON.parse(window.localStorage.getItem('salatk_timeplan_done') || '{}')).toEqual({
            'plan-target': true
        });
        expect(result.targets).toHaveLength(3);
        expect(result.appliedTargets).toHaveLength(3);

        cleanup();
    });

    it('applies linked tasks when the trigger is completed', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/variable-service.js',
                'js/variable-manager.js'
            ]
        });

        const taskToggle = vi.fn().mockResolvedValue({
            id: 'task-target',
            dueDate: '2026-03-24',
            status: 'completed'
        });

        window.showToast = vi.fn();
        window.TaskService = { toggleTaskStatus: taskToggle };

        window.VariableService.getLinkedElements = vi.fn(() => [
            { variable: 'LINK', elementType: 'task', elementId: 'task-target', trigger: 'completed' }
        ]);
        window.VariableService.getForElement = vi.fn(() => null);

        const result = await window.VariableManager.activate('LINK', 'task', 'source-task', 'completed', {
            date: '2026-03-24'
        });

        expect(taskToggle).toHaveBeenCalledWith('task-target', 'completed');
        expect(result.targets).toHaveLength(1);
        expect(result.appliedTargets).toHaveLength(1);

        cleanup();
    });

    it('passes the task due date into variable activation', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/variable-service.js',
                'js/services/task-service.js',
                'js/variable-manager.js',
                'js/pages/daily-tasks.js'
            ]
        });

        window.currentPage = 'daily-tasks';
        window.TaskService.toggleTaskStatus = vi.fn().mockResolvedValue({
            id: 'task-1',
            dueDate: '2026-03-25',
            status: 'completed'
        });
        window.VariableService.getForElement = vi.fn().mockReturnValue({
            variable: 'LINK',
            trigger: 'completed'
        });
        window.VariableManager.activate = vi.fn().mockResolvedValue({});
        window.updatePointsDisplay = vi.fn().mockResolvedValue();
        window.renderPage = vi.fn().mockResolvedValue();
        window.showToast = vi.fn();

        await window.handleToggleTask('task-1', 'completed');

        expect(window.VariableManager.activate).toHaveBeenCalledWith(
            'LINK',
            'task',
            'task-1',
            'completed',
            expect.objectContaining({
                date: '2026-03-25',
                page: 'daily-tasks'
            })
        );

        cleanup();
    });

    it('uses the current date fallback for weekly time plan links', async () => {
        const { window, cleanup } = createBootstrappedWindow({
            scripts: [
                'js/services/variable-service.js',
                'js/variable-manager.js',
                'js/pages/time-management.js'
            ]
        });

        window.currentPage = 'time-management';
        window.TimePlanService = {
            getPlanById: vi.fn().mockResolvedValue({
                id: 'plan-1',
                scope: 'weekly',
                date: '2026-03-26'
            })
        };
        window.VariableService.getForElement = vi.fn().mockReturnValue({
            variable: 'LINK',
            trigger: 'done'
        });
        window.VariableManager.activate = vi.fn().mockResolvedValue({});
        window.renderPage = vi.fn().mockResolvedValue();
        window.getCurrentDate = vi.fn(() => '2026-03-27');

        await window.handleMarkTimePlanDone('plan-1', true);

        expect(window.VariableManager.activate).toHaveBeenCalledWith(
            'LINK',
            'timeplan',
            'plan-1',
            'done',
            expect.objectContaining({
                date: '2026-03-27',
                scope: 'weekly',
                page: 'time-management'
            })
        );

        cleanup();
    });
});
