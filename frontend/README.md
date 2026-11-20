# Service Desk Frontend

Next.js frontend for the Laravel service request API in the parent folder.

## Screens

| Screen            | Route                              | Purpose                                                        |
|-------------------|------------------------------------|----------------------------------------------------------------|
| Login             | `/login`                           | Sign in with a Sanctum token                                   |
| Dashboard         | `/dashboard`                       | Totals by status and priority, latest requests                 |
| Service Requests  | `/service-requests`                | Search by title, filter by priority and status, pagination     |
| Create Request    | `/service-requests/new`            | Submit a new request                                           |
| Request Details   | `/service-requests/{id}`           | Request information, current status and version                |
| Status Management | `/service-requests/{id}/status`    | Move to the next status with an optional remark                |
| History           | `/service-requests/{id}/history`   | Chronological status changes from `GET /api/requests/{id}/history` |
| Profile           | `/profile`                         | Signed-in user details, role and permissions                   |
| Users             | `/users`                           | Administrators: search users, edit and delete                  |
| Add User          | `/users/new`                       | Administrators: create a user with a role and permissions      |
| Edit User         | `/users/{id}`                      | Administrators: update details, password, role and permissions |

## UI states

- Loading: skeleton placeholders while data is fetched
- Empty results: messages with a next step, such as clearing filters
- Validation errors: shown next to each field and linked with `aria-describedby`
- Authorization errors: an expired session returns to the login page with a notice, and forbidden actions show an access denied message
- API failures: a clear message with a retry button
- Stale updates: a conflict message, and the latest version of the request is loaded

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

`NEXT_PUBLIC_API_URL` must point to the Laravel API. The default is `http://localhost/lalan-test/api` for WAMP. Use `http://localhost:8000/api` when running `php artisan serve`.

## Demo accounts

| Account    | Email             | Password |
|------------|-------------------|----------|
| Demo Admin | admin@example.com | password |
| Demo User  | user@example.com  | password |

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run start` serves the production build
- `npm run lint` runs ESLint
