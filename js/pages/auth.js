// ========================================
// Auth Page Component
// ========================================

function renderAuthPage(type = 'login') {
    const isLogin = type === 'login';

    return `
        <div class="auth-container">
            <div class="auth-card glass">
                <div class="auth-header">
                    <img src="assets/images/logo.png" alt="Salatk Logo" class="auth-logo">
                    <h2 class="auth-title">${isLogin ? t('login_title') : t('signup_title')}</h2>
                    <p class="auth-subtitle">${isLogin ? t('login_subtitle') : t('signup_subtitle')}</p>
                </div>
                
                <form id="authForm" class="auth-form">
                    ${!isLogin ? `
                    <div class="form-group">
                        <label for="fullName">${t('full_name_label')}</label>
                        <div class="input-wrapper">
                            <input type="text" id="fullName" placeholder="${t('full_name_placeholder')}" required>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label for="username">${t('username_label')}</label>
                        <div class="input-wrapper">
                            <input type="text" id="username" placeholder="${t('username_placeholder')}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">${t('password_label')}</label>
                        <div class="input-wrapper">
                            <input type="password" id="password" placeholder="${t('password_placeholder')}" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block auth-btn">
                        ${isLogin ? t('login_button') : t('signup_button')}
                    </button>
                </form>
                
                <div class="auth-footer">
                    <p>${isLogin ? t('no_account_text') : t('have_account_text')} 
                        <a href="#${isLogin ? 'signup' : 'login'}">
                            ${isLogin ? t('signup_link') : t('login_link')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function toggleAuthType(type) {
    const content = document.getElementById('pageContent');
    content.innerHTML = renderAuthPage(type);
    setupAuthFormListeners(type);
}

function setupAuthFormListeners(type) {
    const form = document.getElementById('authForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('fullName')?.value;

        const btn = form.querySelector('.auth-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${t('loading_auth')}...`;

        try {
            let result;
            if (type === 'login') {
                result = await AuthManager.signIn(username, password);
            } else {
                result = await AuthManager.signUp(username, password, fullName);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
            } else {
                showToast(t(type === 'login' ? 'login_success' : 'signup_success'), 'success');
                // Redirect to home
                window.location.hash = 'daily-prayers';
                window.location.reload();
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = type === 'login' ? t('login_button') : t('signup_button');
        }
    });
}
