(function (App) {
    const FILTER_KEYS = ['search', 'priority', 'status', 'per_page'];

    function badge(type, option) {
        const el = document.createElement('span');
        el.className = `badge badge-${type}-${option.value}`;
        el.textContent = option.label;
        return el;
    }

    function cell(content) {
        const td = document.createElement('td');

        if (content instanceof Node) {
            td.appendChild(content);
        } else {
            td.textContent = content;
        }

        return td;
    }

    function debounce(fn, wait) {
        let timer;

        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
    }

    function initIndex() {
        const form = document.getElementById('filters');
        const body = document.getElementById('requests-body');
        const summary = document.getElementById('pagination-summary');
        const pageLabel = document.getElementById('pagination-page');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const resetButton = document.getElementById('reset-filters');
        const showUrl = (id) => `${window.location.pathname.replace(/\/$/, '')}/${id}`;

        const initial = new URLSearchParams(window.location.search);
        let page = Math.max(parseInt(initial.get('page'), 10) || 1, 1);
        let lastPage = 1;
        let requestId = 0;

        FILTER_KEYS.forEach((key) => {
            if (initial.has(key)) {
                form.elements[key].value = initial.get(key);
            }
        });

        function currentParams() {
            const params = new URLSearchParams();

            FILTER_KEYS.forEach((key) => {
                const value = form.elements[key].value.trim();

                if (value !== '') {
                    params.set(key, value);
                }
            });

            if (page > 1) {
                params.set('page', page);
            }

            return params;
        }

        function renderMessage(message) {
            body.replaceChildren();
            const row = document.createElement('tr');
            const td = cell(message);
            td.colSpan = 6;
            td.className = 'table-empty';
            row.appendChild(td);
            body.appendChild(row);
        }

        function renderRows(items) {
            body.replaceChildren();

            items.forEach((item) => {
                const row = document.createElement('tr');
                const link = document.createElement('a');
                link.href = showUrl(item.id);
                link.textContent = item.title;
                link.className = 'table-link';

                row.append(
                    cell(`#${item.id}`),
                    cell(link),
                    cell(badge('priority', item.priority)),
                    cell(badge('status', item.status)),
                    cell(item.requested_by ? item.requested_by.name : '-'),
                    cell(App.formatDate(item.created_at)),
                );

                body.appendChild(row);
            });
        }

        function renderPagination(meta) {
            lastPage = meta.last_page;
            summary.textContent = meta.total
                ? `Showing ${meta.from} to ${meta.to} of ${meta.total} requests`
                : 'No requests found';
            pageLabel.textContent = `Page ${meta.current_page} of ${Math.max(meta.last_page, 1)}`;
            prevButton.disabled = meta.current_page <= 1;
            nextButton.disabled = meta.current_page >= meta.last_page;
        }

        async function load() {
            const params = currentParams();
            const query = params.toString();
            const current = ++requestId;

            window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
            renderMessage('Loading...');
            prevButton.disabled = true;
            nextButton.disabled = true;

            try {
                const response = await App.request(`/service-requests${query ? `?${query}` : ''}`);

                if (current !== requestId) {
                    return;
                }

                if (response.data.length === 0 && response.meta.current_page > 1 && response.meta.last_page > 0) {
                    page = response.meta.last_page;
                    load();
                    return;
                }

                if (response.data.length === 0) {
                    renderMessage('No service requests match your filters.');
                } else {
                    renderRows(response.data);
                }

                renderPagination(response.meta);
            } catch (error) {
                if (current === requestId) {
                    renderMessage(error.status === 422 ? 'Invalid filters. Please reset and try again.' : 'Unable to load service requests.');
                    summary.textContent = '';
                    pageLabel.textContent = '';
                }
            }
        }

        const reloadFromFirstPage = () => {
            page = 1;
            load();
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            reloadFromFirstPage();
        });

        form.elements.search.addEventListener('input', debounce(reloadFromFirstPage, 350));
        ['priority', 'status', 'per_page'].forEach((key) => {
            form.elements[key].addEventListener('change', reloadFromFirstPage);
        });

        resetButton.addEventListener('click', () => {
            form.reset();
            reloadFromFirstPage();
        });

        prevButton.addEventListener('click', () => {
            if (page > 1) {
                page -= 1;
                load();
            }
        });

        nextButton.addEventListener('click', () => {
            if (page < lastPage) {
                page += 1;
                load();
            }
        });

        load();
    }

    function initCreate() {
        const form = document.getElementById('request-form');
        const button = document.getElementById('submit-button');
        const indexUrl = window.location.pathname.replace(/\/create\/?$/, '');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            App.clearFormErrors(form);
            button.disabled = true;
            button.textContent = 'Creating...';

            try {
                const { data } = await App.request('/service-requests', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: form.title.value.trim(),
                        description: form.description.value.trim(),
                        priority: form.priority.value,
                    }),
                });

                window.location.assign(`${indexUrl}/${data.id}`);
            } catch (error) {
                App.showFormErrors(form, error);
                button.disabled = false;
                button.textContent = 'Create request';
            }
        });
    }

    async function initShow() {
        const container = document.getElementById('request-detail');
        const loading = document.getElementById('request-loading');
        const errorBox = document.getElementById('request-error');
        const content = document.getElementById('request-content');

        try {
            const { data } = await App.request(`/service-requests/${container.dataset.requestId}`);

            const values = {
                id: `#${data.id}`,
                title: data.title,
                description: data.description,
                requested_by: data.requested_by ? data.requested_by.name : '-',
                created_at: App.formatDate(data.created_at),
                updated_at: App.formatDate(data.updated_at),
            };

            content.querySelectorAll('[data-field]').forEach((el) => {
                el.textContent = values[el.dataset.field] ?? '';
            });

            ['priority', 'status'].forEach((type) => {
                content.querySelector(`[data-badge="${type}"]`).replaceWith(badge(type, data[type]));
            });

            document.title = `${data.title} | ${document.title.split(' | ').pop()}`;
            loading.hidden = true;
            content.hidden = false;
        } catch (error) {
            loading.hidden = true;
            errorBox.textContent = error.status === 404 ? 'This service request could not be found.' : 'Unable to load this service request.';
            errorBox.hidden = false;
        }
    }

    if (!App.ready) {
        return;
    }

    const pages = {
        'service-requests.index': initIndex,
        'service-requests.create': initCreate,
        'service-requests.show': initShow,
    };

    if (pages[App.page]) {
        pages[App.page]();
    }
})(window.App);
