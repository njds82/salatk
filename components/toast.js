// ========================================
// Toast & Notifications Component
// ========================================

let notifications = JSON.parse(localStorage.getItem('salatk_notifications') || '[]');

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Save to history
    addNotification(message, type);

    // Auto remove after 1 second
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 1000);
}

function addNotification(message, type) {
    const notification = {
        id: Date.now(),
        message,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    notifications.unshift(notification);
    // Keep only last 50 notifications
    if (notifications.length > 50) notifications.pop();

    saveNotifications();
    updateNotifBadge();
    if (document.getElementById('notifCenter').style.display !== 'none') {
        renderNotifList();
    }
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications();
    renderNotifList();
    updateNotifBadge();
}

function clearAllNotifications() {
    notifications = [];
    saveNotifications();
    renderNotifList();
    updateNotifBadge();
}

function saveNotifications() {
    localStorage.setItem('salatk_notifications', JSON.stringify(notifications));
}

function updateNotifBadge() {
    const badge = document.getElementById('notifBadge');
    if (notifications.length > 0) {
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifCenter() {
    const center = document.getElementById('notifCenter');
    if (center.style.display === 'none') {
        center.style.display = 'flex';
        renderNotifList();
        // Hide badge when opened
        document.getElementById('notifBadge').style.display = 'none';
    } else {
        center.style.display = 'none';
    }
}

function renderNotifList() {
    const list = document.getElementById('notifList');
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: var(--spacing-lg);">
                <p data-i18n="no_notifications">${t('no_notifications') || 'لا توجد إشعارات'}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notif-item">
            <div class="notif-item-content">
                <div>${n.message}</div>
                <span class="notif-item-time">${n.time}</span>
            </div>
            <button class="delete-notif" onclick="deleteNotification(${n.id})">&times;</button>
        </div>
    `).join('');
}
