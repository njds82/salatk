// ========================================
// Signup Page Component
// ========================================

async function renderSignupPage() {
    // Add auth-mode class to body to hide nav/header
    document.body.classList.add('auth-mode');

    return `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="assets/images/logo.png" alt="Salatk" width="80" class="auth-logo">
                    <h2 class="auth-title">${t('signup_title')}</h2>
                    <p class="auth-subtitle">${t('habits_subtitle')}</p>
                </div>

                <form id="signupForm" class="auth-form" novalidate>
                    <div class="auth-input-group">
                        <label class="form-label">${t('full_name')}</label>
                        <input type="text" id="fullName" class="form-input" placeholder="${t('full_name')}" required>
                        <span class="error-hint">${t('field_required')}</span>
                    </div>

                    <div class="auth-input-group">
                        <label class="form-label">${t('email')}</label>
                        <input type="email" id="email" class="form-input" placeholder="example@mail.com" required>
                        <span class="error-hint">${t('invalid_email')}</span>
                    </div>

                    <div class="auth-input-group">
                        <label class="form-label">${t('password')}</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                        <span class="error-hint">${t('field_required')}</span>
                    </div>

                    <div class="auth-input-group">
                        <label class="form-label">${t('confirm_password')}</label>
                        <input type="password" id="confirmPassword" class="form-input" placeholder="••••••••" required>
                        <span class="error-hint">${t('password_mismatch')}</span>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">
                        ${t('signup_btn')}
                    </button>
                </form>

                <div class="auth-footer">
                    <p>${t('have_account')} <a href="#login" class="auth-link">${t('login_title')}</a></p>
                </div>
            </div>
        </div>
    `;
}

// Handle signup form submission
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'signupForm') {
        e.preventDefault();

        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        // Reset errors
        document.querySelectorAll('.auth-input-group').forEach(el => el.classList.remove('has-error'));

        let isValid = true;

        if (!fullName.value) {
            fullName.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (!email.value || !validateEmail(email.value)) {
            email.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (!password.value) {
            password.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (password.value !== confirmPassword.value) {
            confirmPassword.parentElement.classList.add('has-error');
            isValid = false;
        }

        if (isValid) {
            const result = AuthManager.register(fullName.value, email.value, password.value);
            if (result.success) {
                showToast(t('signup_success'), 'success');
                document.body.classList.remove('auth-mode');
                window.location.hash = 'daily-prayers';
            } else {
                showToast(result.message, 'error');
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
