(function (App) {
    function initLogin() {
        if (App.getToken()) {
            window.location.replace(App.urls.home);
            return;
        }

        const form = document.getElementById('login-form');
        const button = document.getElementById('login-button');

        document.querySelectorAll('.demo-account').forEach((el) => {
            el.addEventListener('click', () => {
                form.email.value = el.dataset.email;
                form.password.value = 'password';
                App.clearFormErrors(form);
            });
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            App.clearFormErrors(form);
            button.disabled = true;
            button.textContent = 'Signing in...';

            try {
                const data = await App.request('/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: form.email.value,
                        password: form.password.value,
                        device_name: 'web',
                    }),
                });

                App.setToken(data.token);
                window.location.replace(App.urls.home);
            } catch (error) {
                App.showFormErrors(form, error);
                button.disabled = false;
                button.textContent = 'Sign in';
            }
        });
    }

    async function initProfile() {
        const { data: user } = await App.request('/me');

        const values = {
            id: user.id,
            name: user.name,
            email: user.email,
            email_verified_at: App.formatDate(user.email_verified_at, 'Not verified'),
            created_at: App.formatDate(user.created_at),
        };

        document.querySelectorAll('[data-field]').forEach((el) => {
            el.textContent = values[el.dataset.field] ?? '';
        });

        document.getElementById('profile-loading').hidden = true;
        document.getElementById('profile-content').hidden = false;
    }

    if (!App.ready) {
        return;
    }

    if (App.page === 'login') {
        initLogin();
    }

    if (App.page === 'profile') {
        initProfile().catch(() => undefined);
    }
})(window.App);
