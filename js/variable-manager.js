// ========================================
// Variable Manager
// Central dispatcher for the variable connection system.
//
// When an element (prayer/habit/task/timeplan) performs its
// trigger action, it calls VariableManager.activate(...).
// The manager looks up all other elements sharing the same
// variable and fires actions on them automatically.
// ========================================

const VARIABLE_TIME_PLAN_DONE_KEY = 'salatk_timeplan_done';

function resolveActivationDate(context, fallbackDate = null) {
    if (context && typeof context.date === 'string' && context.date.trim()) {
        return context.date.trim();
    }

    if (typeof fallbackDate === 'string' && fallbackDate.trim()) {
        return fallbackDate.trim();
    }

    if (typeof fallbackDate === 'function') {
        const resolved = fallbackDate();
        if (typeof resolved === 'string' && resolved.trim()) {
            return resolved.trim();
        }
    }

    if (typeof getCurrentDate === 'function') {
        return getCurrentDate();
    }

    return new Date().toISOString().slice(0, 10);
}

const VariableManager = {
    // Track in-flight activations to prevent recursion / loops
    _activating: new Set(),

    _getTimePlanDoneMap() {
        try {
            return JSON.parse(localStorage.getItem(VARIABLE_TIME_PLAN_DONE_KEY) || '{}');
        } catch {
            return {};
        }
    },

    async _setTimePlanDone(planId, isDone) {
        if (window.TimePlanService?.setPlanDone) {
            const result = await TimePlanService.setPlanDone(planId, isDone);
            return result?.success !== false;
        }

        try {
            const map = this._getTimePlanDoneMap();
            if (isDone) {
                map[planId] = true;
            } else {
                delete map[planId];
            }
            localStorage.setItem(VARIABLE_TIME_PLAN_DONE_KEY, JSON.stringify(map));
            return true;
        } catch (error) {
            console.warn('VariableManager: failed to update time plan state', error);
            return false;
        }
    },

    async _applyTargetAction(target, eventValue, context) {
        if (!target) return false;

        if (target.elementType === 'prayer') {
            if (!['done', 'missed'].includes(eventValue) || !window.PrayerService?.markPrayer) {
                return false;
            }

            const activationDate = resolveActivationDate(context, window.selectedDate);
            const result = await window.PrayerService.markPrayer(target.elementId, activationDate, eventValue);
            return Boolean(result && result.success !== false);
        }

        if (target.elementType === 'habit') {
            if (!['done', 'committed', 'avoided'].includes(eventValue) || !window.HabitService?.logAction) {
                return false;
            }

            const activationDate = resolveActivationDate(context, window.selectedDate);
            await window.HabitService.logAction(target.elementId, activationDate, eventValue);
            return true;
        }

        if (target.elementType === 'task') {
            if (eventValue !== 'completed' || !window.TaskService?.toggleTaskStatus) {
                return false;
            }

            const updatedTask = await window.TaskService.toggleTaskStatus(target.elementId, 'completed');
            return Boolean(updatedTask);
        }

        if (target.elementType === 'timeplan') {
            if (eventValue !== 'done') {
                return false;
            }

            return await this._setTimePlanDone(target.elementId, true);
        }

        return false;
    },

    /**
     * Called when an element fires its trigger.
     *
     * @param {string} variable     The variable word
     * @param {string} sourceType   e.g. 'prayer', 'habit', 'task', 'timeplan'
     * @param {string} sourceId     The element's ID
     * @param {string} eventValue   The trigger value that matched (e.g. 'done', 'completed')
     */
    async activate(variable, sourceType, sourceId, eventValue, context = {}) {
        if (!variable || !window.VariableService) {
            return {
                variable,
                sourceType,
                sourceId,
                eventValue,
                context,
                targets: [],
                appliedTargets: []
            };
        }

        const key = `${variable}:${sourceType}:${sourceId}`;
        if (this._activating.has(key)) {
            return {
                variable,
                sourceType,
                sourceId,
                eventValue,
                context,
                targets: [],
                appliedTargets: []
            };
        }
        this._activating.add(key);

        const detail = {
            variable,
            sourceType,
            sourceId,
            eventValue,
            context,
            targets: [],
            appliedTargets: []
        };

        try {
            // Fetch all elements linked to this variable
            const linked = VariableService.getLinkedElements(variable);

            // Find elements whose trigger matches the eventValue, excluding the source
            const targets = linked.filter((l) =>
                !(l.elementType === sourceType && l.elementId === sourceId) &&
                l.trigger === eventValue
            );
            detail.targets = targets;

            if (targets.length === 0) {
                return detail;
            }

            for (const target of targets) {
                try {
                    const applied = await this._applyTargetAction(target, eventValue, context);
                    if (applied) {
                        detail.appliedTargets.push(target);

                        const targetLink = VariableService.getForElement(target.elementType, target.elementId);
                        if (targetLink && targetLink.variable && targetLink.trigger === eventValue) {
                            const chained = await this.activate(
                                targetLink.variable,
                                target.elementType,
                                target.elementId,
                                eventValue,
                                context
                            );
                            if (chained?.appliedTargets?.length) {
                                detail.appliedTargets.push(...chained.appliedTargets);
                            }
                        }
                    }
                } catch (error) {
                    console.error('VariableManager: Failed to apply linked target', error);
                }
            }

            // Dispatch a CustomEvent so each page can refresh its own UI context.
            window.dispatchEvent(new CustomEvent('variableActivated', { detail }));

            // Show a subtle toast notification.
            if (window.showToast && typeof t === 'function') {
                showToast(`🔗 ${t('variable_activated')} "${variable}"`, 'info');
            }

            return detail;
        } finally {
            // Allow re-activation after a short delay to handle rapid re-triggers
            setTimeout(() => this._activating.delete(key), 1000);
        }
    },

    /**
     * Shows a modal to assign/edit/remove a variable for an element.
     *
     * @param {string} elementType  e.g. 'prayer', 'habit', 'task', 'timeplan'
     * @param {string} elementId    The element's ID
     * @param {Array<{value:string, label:string}>} triggerOptions  List of available triggers
     * @param {Function} onSave     Called after successful save (to refresh card UI)
     */
    showAssignModal(elementType, elementId, triggerOptions, onSave) {
        if (!window.VariableService || !window.showModal) return;

        const existing = VariableService.getForElement(elementType, elementId);
        const currentVar = existing ? existing.variable : '';
        const currentTrigger = existing ? existing.trigger : (triggerOptions[0]?.value || '');

        const optionsHtml = triggerOptions.map(opt =>
            `<option value="${opt.value}" ${currentTrigger === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        const content = `
            <div class="form-group">
                <label class="form-label" for="variableInput">${typeof t === 'function' ? t('variable_label') : 'المتغير'}</label>
                <input
                    type="text"
                    class="form-input"
                    id="variableInput"
                    maxlength="5"
                    value="${currentVar}"
                    placeholder="${typeof t === 'function' ? t('variable_placeholder') : '1-5 أحرف'}"
                    style="font-family: monospace; letter-spacing: 2px;"
                    oninput="this.value = this.value.replace(/\\s/g, '')"
                >
                <p style="font-size: 0.78rem; color: var(--color-text-tertiary); margin-top: 4px;">
                    ${typeof t === 'function' ? t('variable_hint') : 'كلمة من 1 إلى 5 أحرف — العناصر التي تشترك في نفس المتغير تتفعل معاً'}
                </p>
            </div>
            <div class="form-group">
                <label class="form-label" for="variableTriggerSelect">${typeof t === 'function' ? t('variable_trigger') : 'حدث التفعيل'}</label>
                <select class="form-select" id="variableTriggerSelect">
                    ${optionsHtml}
                </select>
            </div>
            ${existing ? `
                <div style="margin-top:var(--spacing-md); padding-top:var(--spacing-md); border-top: 1px solid var(--color-border);">
                    <button class="btn btn-danger btn-sm" onclick="window._varRemoveFn && window._varRemoveFn()">
                        🗑 ${typeof t === 'function' ? t('variable_remove') : 'إزالة المتغير'}
                    </button>
                </div>
            ` : ''}
        `;

        // Temporary global for remove action inside modal HTML
        window._varRemoveFn = async () => {
            const result = await VariableService.remove(elementType, elementId);
            if (!result?.success) {
                if (window.showToast) showToast(typeof t === 'function' ? t('variable_invalid') : 'يجب أن يكون المتغير 1-5 أحرف', 'error');
                return;
            }

            if (window.showToast) showToast(typeof t === 'function' ? t('variable_removed') : 'تم حذف المتغير', 'info');
            closeModal();
            if (onSave) await onSave();
            delete window._varRemoveFn;
        };

        showModal(
            typeof t === 'function' ? t('enter_variable') : 'أدخل متغير',
            content,
            [
                {
                    label: typeof t === 'function' ? t('cancel') : 'إلغاء',
                    className: 'btn-secondary',
                    onclick: () => {
                        closeModal();
                        delete window._varRemoveFn;
                    }
                },
                {
                    label: typeof t === 'function' ? t('save') : 'حفظ',
                    className: 'btn-primary',
                    onclick: async () => {
                        const varInput = document.getElementById('variableInput');
                        const triggerSelect = document.getElementById('variableTriggerSelect');
                        const variable = (varInput?.value || '').trim();
                        const trigger = triggerSelect?.value || triggerOptions[0]?.value || '';

                        if (!variable) {
                            // Empty = remove
                            await VariableService.remove(elementType, elementId);
                            if (window.showToast) showToast(typeof t === 'function' ? t('variable_removed') : 'تم حذف المتغير', 'info');
                            closeModal();
                            delete window._varRemoveFn;
                            if (onSave) await onSave();
                            return;
                        }

                        const result = await VariableService.set(variable, elementType, elementId, trigger);
                        if (!result.success) {
                            if (window.showToast) showToast(typeof t === 'function' ? t('variable_invalid') : 'يجب أن يكون المتغير 1-5 أحرف', 'error');
                            return;
                        }

                        if (window.showToast) showToast(typeof t === 'function' ? t('variable_saved') : 'تم حفظ المتغير', 'success');
                        closeModal();
                        delete window._varRemoveFn;
                        if (onSave) await onSave();
                    }
                }
            ]
        );
    }
};

window.VariableManager = VariableManager;
