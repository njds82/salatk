// ========================================
// Offline UI Manager
// ========================================
// Shows/hides an offline banner and disables network-dependent features
// when the device has no internet connectivity.

const OfflineUI = (() => {
    let _banner = null;
    let _isOffline = !navigator.onLine;

    function _createBanner() {
        const el = document.createElement('div');
        el.id = 'offlineBanner';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = `
            <span class="offline-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                    <circle cx="12" cy="20" r="1" fill="currentColor"/>
                </svg>
            </span>
            <span data-offline-text></span>
        `;
        document.body.appendChild(el);
        return el;
    }

    function _updateText() {
        if (!_banner) return;
        const textEl = _banner.querySelector('[data-offline-text]');
        if (!textEl) return;
        // Use i18n if available, otherwise fallback
        textEl.textContent = (typeof window.t === 'function')
            ? (t('offline_banner') || 'لا يوجد اتصال — يتم عرض البيانات المحفوظة')
            : 'لا يوجد اتصال — يتم عرض البيانات المحفوظة';
    }

    function _show() {
        if (!_banner) _banner = _createBanner();
        _updateText();
        _banner.classList.add('visible');
        document.body.classList.add('app-offline');
    }

    function _hide() {
        if (_banner) _banner.classList.remove('visible');
        document.body.classList.remove('app-offline');
    }

    function _onOffline() {
        _isOffline = true;
        _show();
        console.log('OfflineUI: App went offline');
    }

    function _onOnline() {
        _isOffline = false;
        _hide();
        console.log('OfflineUI: App back online');

        // Refresh current page to fetch fresh data
        if (typeof window.renderPage === 'function' && window.currentPage) {
            setTimeout(() => {
                renderPage(window.currentPage, true, { forceFresh: true, preferCache: false });
            }, 800); // small delay so network is stable
        }
    }

    function init() {
        window.addEventListener('offline', _onOffline);
        window.addEventListener('online', _onOnline);

        // Reflect initial state
        if (_isOffline) _show();
    }

    function isOffline() {
        return _isOffline;
    }

    return { init, isOffline };
})();

window.OfflineUI = OfflineUI;
