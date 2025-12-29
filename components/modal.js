// ========================================
// Modal Component
// ========================================

// Store current confirm callback
let _currentConfirmCallback = null;

function showModal(title, content, actions = []) {
    const overlay = document.getElementById('modalOverlay');

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
        </div>
        <div class="modal-body">
            ${content}
        </div>
        <div class="modal-footer"></div>
    `;

    overlay.innerHTML = '';
    overlay.appendChild(modal);

    // Add action buttons with proper event listeners
    const footer = modal.querySelector('.modal-footer');
    actions.forEach(action => {
        const button = document.createElement('button');
        button.className = `btn ${action.className || 'btn-secondary'}`;
        button.textContent = action.label;
        button.onclick = action.onclick;
        footer.appendChild(button);
    });

    overlay.style.display = 'flex';

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    };
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    _currentConfirmCallback = null;
}

function confirmDialog(message, onConfirm) {
    // Store callback globally
    _currentConfirmCallback = onConfirm;

    showModal(
        t('confirm'),
        `<p>${message}</p>`,
        [
            {
                label: t('cancel'),
                className: 'btn-secondary',
                onclick: () => closeModal()
            },
            {
                label: t('confirm'),
                className: 'btn-primary',
                onclick: async () => {
                    closeModal();
                    if (_currentConfirmCallback) {
                        await _currentConfirmCallback();
                    }
                }
            }
        ]
    );
}
window.showModal = showModal;
window.closeModal = closeModal;
window.confirmDialog = confirmDialog;
