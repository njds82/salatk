// ========================================
// Variable Manager
// Central dispatcher for the variable connection system.
//
// When an element (prayer/habit/task/timeplan) performs its
// trigger action, it calls VariableManager.activate(...).
// The manager looks up all other elements sharing the same
// variable and fires actions on them automatically.
// ========================================

const VariableManager = {
    // Track in-flight activations to prevent recursion / loops
    _activating: new Set(),

    /**
     * Called when an element fires its trigger.
     *
     * @param {string} variable     The variable word
     * @param {string} sourceType   e.g. 'prayer', 'habit', 'task', 'timeplan'
     * @param {string} sourceId     The element's ID
     * @param {string} eventValue   The trigger value that matched (e.g. 'done', 'completed')
     */
    activate(variable, sourceType, sourceId, eventValue) {
        if (!variable || !window.VariableService) return;

        const key = `${variable}:${sourceType}:${sourceId}`;
        if (this._activating.has(key)) return; // Prevent infinite loops
        this._activating.add(key);

        try {
            // Fetch all elements linked to this variable
            const linked = VariableService.getLinkedElements(variable);

            // Find elements whose trigger matches the eventValue, excluding the source
            const targets = linked.filter(l =>
                !(l.elementType === sourceType && l.elementId === sourceId) &&
                l.trigger === eventValue
            );

            if (targets.length === 0) {
                this._activating.delete(key);
                return;
            }

            // Dispatch a CustomEvent so each page can handle it in its own context
            window.dispatchEvent(new CustomEvent('variableActivated', {
                detail: {
                    variable,
                    sourceType,
                    sourceId,
                    eventValue,
                    targets
                }
            }));

            // Show a subtle toast notification
            if (window.showToast && typeof t === 'function') {
                showToast(`🔗 ${t('variable_activated')} "${variable}"`, 'info');
            }
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
        window._varRemoveFn = () => {
            VariableService.remove(elementType, elementId);
            if (window.showToast) showToast(typeof t === 'function' ? t('variable_removed') : 'تم حذف المتغير', 'info');
            closeModal();
            if (onSave) onSave();
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
                    onclick: () => {
                        const varInput = document.getElementById('variableInput');
                        const triggerSelect = document.getElementById('variableTriggerSelect');
                        const variable = (varInput?.value || '').trim();
                        const trigger = triggerSelect?.value || triggerOptions[0]?.value || '';

                        if (!variable) {
                            // Empty = remove
                            VariableService.remove(elementType, elementId);
                            if (window.showToast) showToast(typeof t === 'function' ? t('variable_removed') : 'تم حذف المتغير', 'info');
                            closeModal();
                            delete window._varRemoveFn;
                            if (onSave) onSave();
                            return;
                        }

                        const result = VariableService.set(variable, elementType, elementId, trigger);
                        if (!result.success) {
                            if (window.showToast) showToast(typeof t === 'function' ? t('variable_invalid') : 'يجب أن يكون المتغير 1-5 أحرف', 'error');
                            return;
                        }

                        if (window.showToast) showToast(typeof t === 'function' ? t('variable_saved') : 'تم حفظ المتغير', 'success');
                        closeModal();
                        delete window._varRemoveFn;
                        if (onSave) onSave();
                    }
                }
            ]
        );
    }
};

window.VariableManager = VariableManager;
