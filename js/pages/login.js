// ========================================
// Login Page Component
// ========================================

async function renderLoginPage() {
    // Add auth-mode class to body to hide nav/header
    document.body.classList.add('auth-mode');

    return `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="assets/images/logo.png" alt="Salatk" width="80" class="auth-logo">
                    <h2 class="auth-title">${t('login_title')}</h2>
                    <p class="auth-subtitle">${t('daily_prayers_subtitle')}</p>
                </div>

                <form id="loginForm" class="auth-form" novalidate>
                    <div class="auth-input-group">
                        <label class="form-label">${t('email')}</label>
                        <input type="email" id="email" class="form-input" placeholder="example@mail.com" required>
                        <span class="error-hint" id="emailError">${t('invalid_email')}</span>
                    </div>

                    <div class="auth-input-group">
                        <label class="form-label">${t('password')}</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                        <span class="error-hint" id="passwordError">${t('field_required')}</span>
                    </div>

                    <div id="authErrorMessage" class="error-message text-center" style="display: none; color: var(--color-error); font-size: 0.9rem; margin-top: -10px;">
                        ${t('auth_error')}
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">
                        ${t('login_btn')}
                    </button>
                </form>

                <div class="auth-footer">
                    <p>${t('no_account')} <a href="#signup" class="auth-link">${t('signup_title')}</a></p>
                </div>
            </div>
        </div>
    `;
}

// Handle login form submission
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'loginForm') {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const authError = document.getElementById('authErrorMessage');

        // Reset errors
        document.querySelectorAll('.auth-input-group').forEach(el => el.classList.remove('has-error'));
        authError.style.display = 'none';

        let isValid = true;

        if (!emailInput.value || !validateEmail(emailInput.value)) {
            emailInput.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (!passwordInput.value) {
            passwordInput.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (isValid) {
            const result = AuthManager.login(emailInput.value, passwordInput.value);
            if (result.success) {
                showToast(t('login_btn'), 'success');
                document.body.classList.remove('auth-mode');
                window.location.hash = 'daily-prayers';
            } else {
                authError.style.display = 'block';
            }
        }
    }
});

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}
