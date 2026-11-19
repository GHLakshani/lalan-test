window.App = (function () {
    const TOKEN_KEY = 'auth_token';

    const meta = (name) => document.querySelector(`meta[name="${name}"]`).getAttribute('content');

    const urls = {
        api: meta('api-url'),
        login: meta('login-url'),
        home: meta('home-url'),
    };

    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
    const clearToken = () => localStorage.removeItem(TOKEN_KEY);

    function redirectToLogin() {
        clearToken();
        window.location.replace(urls.login);
    }

    async function request(path, options = {}) {
        const headers = { Accept: 'application/json' };
        const token = getToken();

        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${urls.api}${path}`, { ...options, headers });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401 && document.body.dataset.auth === 'required') {
            redirectToLogin();
        }

        if (!response.ok) {
            const error = new Error(data.message || 'Request failed.');
            error.status = response.status;
            error.errors = data.errors || {};
            throw error;
        }

        return data;
    }

    function formatDate(value, fallback = '-') {
        return value ? new Date(value).toLocaleString() : fallback;
    }

    function clearFormErrors(form) {
        form.querySelectorAll('[data-error-for]').forEach((el) => {
            el.textContent = '';
        });

        const alertBox = form.querySelector('.alert');

        if (alertBox) {
            alertBox.hidden = true;
            alertBox.textContent = '';
        }
    }

    function showFormErrors(form, error) {
        if (error.status === 422) {
            Object.entries(error.errors).forEach(([field, messages]) => {
                const el = form.querySelector(`[data-error-for="${field}"]`);

                if (el) {
                    el.textContent = messages[0];
                }
            });
            return;
        }

        const alertBox = form.querySelector('.alert');

        if (alertBox) {
            alertBox.textContent = error.status ? error.message : 'Unable to reach the server. Please try again.';
            alertBox.hidden = false;
        }
    }

    function initLayout() {
        if (document.body.dataset.auth !== 'required') {
            return true;
        }

        if (!getToken()) {
            redirectToLogin();
            return false;
        }

        const logoutButton = document.getElementById('logout-button');

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                logoutButton.disabled = true;
                logoutButton.textContent = 'Logging out...';

                try {
                    await request('/logout', { method: 'POST' });
                } finally {
                    redirectToLogin();
                }
            });
        }

        return true;
    }

    const ready = initLayout();

    return {
        urls,
        ready,
        request,
        getToken,
        setToken,
        clearToken,
        formatDate,
        clearFormErrors,
        showFormErrors,
        page: document.body.dataset.page,
    };
})();
