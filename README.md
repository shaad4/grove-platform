# Grove

Multi-tenant client onboarding and request management for freelancers and small agencies.

Each client gets their own isolated portal to submit requests and track progress. The provider manages everything from a single dashboard with real-time push updates — no polling, no refresh.

---

## Tech Stack

**Backend** — Python 3.11, Django 5, Django REST Framework, Django Channels, Celery, Celery Beat  
**Database** — PostgreSQL, Redis  
**Frontend** — React 18, Redux Toolkit, React Query, React Router v6  
**File Storage** — AWS S3 / Cloudinary via django-storages  
**Auth** — JWT (simplejwt), custom subdomain middleware for tenant resolution  
**Deployment** — Docker, Nginx, Gunicorn, Daphne, Render / Railway

---

## Architecture

Repository pattern with a service layer. Multi-tenancy enforced at the query level — every table scoped by `tenant_id`.

```
Browser (React)
│
├── HTTP → Nginx → Gunicorn → Django + DRF → PostgreSQL
│                                           → Redis (cache)
│
└── WebSocket → Nginx → Daphne → Django Channels → Redis (channel layer)
                                                  → Celery workers
                                                  → Celery Beat
```

---

## Features

**Provider**
- Unified request inbox across all clients with filter, sort, and bulk actions
- Request pipeline: `Received → In Review → In Progress → Delivered`
- Per-client isolated portals, internal notes, tags, and full activity logs
- Live notification feed — new requests, replies, status changes
- Basic white-labeling — clients see your brand, not Grove
- Analytics: request volume, average response time, client activity scores

**Client**
- Submit requests with file attachments via a clean, no-jargon form
- Track every request with friendly status labels and a visual progress bar
- Per-request chat thread with the provider
- Live notifications on status changes and message delivery

**AI** *(OpenAI, async via Celery)*
- Smart request summarization on submission
- Reply suggestions based on request context
- Auto-categorization of incoming requests

**Grove Admin**
- Internal control panel at `/grove-admin/` — not publicly linked
- Manage tenants, users, plans, and platform-wide usage
- Upgrade / downgrade / suspend tenants; deactivate users; set custom plan limits

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+

### Local Setup

```bash
git clone https://github.com/your-username/grove.git
cd grove

cp .env.example .env

docker compose up --build
```

Django API → `http://localhost:8000`  
React frontend → `http://localhost:5173`

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | Django secret key |
| `OPENAI_API_KEY` | AI features |
| `AWS_ACCESS_KEY_ID` | S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | S3 file storage |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket name |
| `GROVE_ADMIN_USERNAME` | Superuser login |
| `GROVE_ADMIN_PASSWORD` | Superuser login |

---

## Running Tests

```bash
# Run backend tests
docker compose exec web pytest

# With coverage
docker compose exec web pytest --cov=. --cov-report=term-missing
```

---

## Project Structure

```
grove/
├── apps/
│   ├── tenants/        # Tenant and plan management
│   ├── users/          # Provider and client auth
│   ├── requests/       # Request pipeline and activities
│   ├── chat/           # Messages and reply templates
│   ├── notifications/  # Real-time notification system
│   ├── billing/        # Plan limits and billing history
│   └── admin_panel/    # Grove admin module
├── core/               # Settings, middleware, routing
├── frontend/           # React application
└── docker-compose.yml
```

---

## License

MIT
