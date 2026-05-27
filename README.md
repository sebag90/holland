# 🏡 Holland — Vacation Home Management

A simple tool for up to 5 people to manage a shared vacation home:

- **Kalender**: book stays (internal vs external)  
- **Forum**: threads with replies, polls, image & document uploads
- **TO-DO**: shared task list, everyone can add / tick / edit / delete
- **Homepage**: current-month overview + latest threads
- **UI in Deutsch**, dates as `DD.MM.YYYY HH:MM`

## Architecture

| Component | Stack |
|-----------|-------|
| Backend   | Python · FastAPI · SQLAlchemy · UV |
| Database  | PostgreSQL 16 |
| Frontend  | React + Vite, served by nginx (proxies `/api`) |
| Hosting   | Podman quadlets (see `quadlets/`) |

## Authentication

Since revision 1, users are **not** created via the UI. They are read from an
**htpasswd file** mounted into the backend container.

- Default path inside the container: `/etc/holland/htpasswd`
- Configurable via the `HTPASSWD_FILE` env var
- **Only bcrypt entries are supported** (`htpasswd -B`)
- File is re-read on every login, so changes take effect immediately

A starter file `backend/htpasswd.example` is provided with one demo user:

| Username | Password      |
|----------|---------------|
| `test`   | `password123` |

On first `just backend` the dev `backend/htpasswd` is auto-created from the example.

### Adding / changing users

```sh
just htpasswd-add alice    # prompts for password, writes bcrypt entry
just htpasswd-add bob
```

(Uses the `httpd:2.4-alpine` container, so you don't need `htpasswd` on the host.)

## Bookings

Two kinds:

- **Intern** — created by an account holder; only the creator can modify/delete it.
- **Extern** — represents a stay for guests without an account; **any** logged-in
  user can edit or delete it.

Different colors in the calendar; your own internal bookings additionally have an
accent outline.

## Development

Requires: `podman`, `just`.

```sh
just db         # postgres on :5432
just backend    # builds + runs backend on :8000 (mounts ./backend/htpasswd)
just frontend   # builds + runs frontend on :8080 (proxies /api → backend)
just down       # stop everything
just reset-db   # drop the postgres volume (use after schema changes)
just logs holland-backend
```

Open <http://localhost:8080> and log in as `test` / `password123`.

### Local frontend dev (hot reload)

```sh
cd frontend && npm install && npm run dev
# Vite dev server on :5173, proxies /api -> http://localhost:8000
```

## Production (Podman Quadlets)

Copy the units in `quadlets/` to `~/.config/containers/systemd/` (rootless) or
`/etc/containers/systemd/` (system). Place your bcrypt htpasswd at
`/etc/holland/htpasswd` (or edit the Volume= line). Build images locally and:

```sh
systemctl --user daemon-reload
systemctl --user start holland-frontend.service
```

Override secrets via `EnvironmentFile=` drop-ins:
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`

## API quick reference

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/auth/login`            | Login with htpasswd creds, returns JWT |
| GET    | `/api/auth/me`               | Current user |
| GET    | `/api/auth/users`            | All known users |
| GET    | `/api/bookings`              | List bookings |
| POST   | `/api/bookings`              | Create booking (kind=internal|external) |
| PATCH  | `/api/bookings/{id}`         | Update — internal: owner only; external: anyone |
| DELETE | `/api/bookings/{id}`         | Delete — same rule |
| GET    | `/api/todos`                 | List todos |
| POST   | `/api/todos`                 | Add todo |
| PATCH  | `/api/todos/{id}`            | Edit text or toggle done |
| DELETE | `/api/todos/{id}`            | Delete (anyone) |
| GET    | `/api/threads`               | List threads |
| POST   | `/api/threads`               | Create thread (optional poll + attachments) |
| GET    | `/api/threads/{id}`          | Thread detail |
| POST   | `/api/threads/{id}/posts`    | Reply |
| POST   | `/api/threads/{id}/poll/vote`| Vote |
| POST   | `/api/files/upload`          | Upload file (≤25 MB) |
| GET    | `/api/files/{id}`            | Download attachment |
