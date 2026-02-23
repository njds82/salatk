export function buildBaseDom() {
    return `
        <div id="pageContent"></div>
        <div id="toastContainer"></div>
        <div id="notifCenter" style="display:none"></div>
        <div id="notifList"></div>
        <span id="notifBadge"></span>
        <div id="modalOverlay" style="display:none"></div>
        <div id="pointsDisplay"><span id="pointsValue">0</span></div>
        <button id="langToggle"><span class="lang-text">EN</span></button>
        <button id="themeToggle"><span class="sun-icon"></span><span class="moon-icon"></span></button>
        <button id="notifToggle"></button>
        <button id="closeNotif"></button>
        <button id="clearNotifs"></button>
        <button id="navMenuToggle"></button>
        <div id="navDrawerBackdrop"></div>
        <button id="navDrawerClose"></button>
        <nav id="mainNav"></nav>
        <div id="splashScreen"></div>
        <div id="splashQuote"></div>
        <main id="pageContent"></main>
    `;
}

export function mountBaseDom(window) {
    window.document.body.innerHTML = buildBaseDom();

    const pageContentNodes = window.document.querySelectorAll('#pageContent');
    if (pageContentNodes.length > 1) {
        for (let i = 1; i < pageContentNodes.length; i++) {
            pageContentNodes[i].remove();
        }
    }
}
