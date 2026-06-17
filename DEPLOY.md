# Deploy GoalNest (hosting guide)

GoalNest is a monorepo with:

| Service | Tech | Port |
|---------|------|------|
| **web** | Next.js 14 | 3000 |
| **backend** | NestJS + Prisma | 3001 |
| **postgres** | PostgreSQL 16 | 5432 |
| **redis** | Redis 7 | 6379 |

The easiest way to host everything is a **Linux VPS with Docker Compose**.

---

## Option A — VPS + Docker Compose (recommended)

Works on DigitalOcean, Hetzner, AWS Lightsail, Linode, or any Ubuntu server.

### 1. Get a server

- **Minimum:** 2 GB RAM, 1 vCPU (e.g. DigitalOcean $12/mo droplet)
- OS: **Ubuntu 24.04**

### 2. Install Docker on the server

SSH into your server, then:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in so docker group applies
```

### 3. Upload the project

**Option 1 — Git (recommended)**

On your PC, initialize git and push to GitHub:

```powershell
cd c:\Users\Admin\Desktop\savingsapp
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USER/goalnest.git
git push -u origin main
```

On the server:

```bash
git clone https://github.com/YOUR_USER/goalnest.git
cd goalnest
```

**Option 2 — Copy files**

Zip the project (exclude `node_modules`) and upload via SCP / SFTP.

### 4. Configure production env

```bash
cp .env.production.example .env
nano .env
```

Set at minimum:

- `JWT_SECRET` — run `openssl rand -base64 48`
- `JWT_REFRESH_SECRET` — another random string
- `POSTGRES_PASSWORD` — strong database password
- `CORS_ORIGIN` — your public URL, e.g. `https://goalnest.yourdomain.com`

### 5. Start the stack

```bash
docker compose up -d --build
```

First boot runs Prisma migrations automatically. Check logs:

```bash
docker compose logs -f backend
docker compose ps
```

Open `http://YOUR_SERVER_IP:3000` — you should see the app.

### 6. Point a domain + HTTPS (Caddy reverse proxy)

Install Caddy on the server:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

Create `/etc/caddy/Caddyfile`:

```
goalnest.yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

Update `.env`:

```
CORS_ORIGIN=https://goalnest.yourdomain.com
```

Then restart:

```bash
docker compose up -d --build
```

---

## Option B — Railway (no server management)

Good if you want managed Postgres/Redis and Git-based deploys.

1. Create a project at [railway.app](https://railway.app)
2. Add **PostgreSQL** and **Redis** plugins
3. Deploy **backend** from `backend/Dockerfile` (set root directory / build context to repo root)
4. Deploy **web** from `web/Dockerfile`
5. Set backend env vars from `backend/.env.example` — use Railway's `DATABASE_URL` and `REDIS_URL`
6. Set `CORS_ORIGIN` to your Railway web URL
7. Set web build args:
   - `NEXT_PUBLIC_API_URL` = your backend's public URL + `/api/v1` (e.g. `https://backend-xxx.up.railway.app/api/v1`)
   - Or use `/api/v1` + `API_PROXY_TARGET` if both services share a private network

---

## Option C — Render

1. Create a **PostgreSQL** database on Render
2. Create a **Web Service** for backend:
   - Root directory: repo root
   - Dockerfile path: `backend/Dockerfile`
   - Add env vars from `.env.production.example`
3. Create a **Web Service** for frontend:
   - Dockerfile path: `web/Dockerfile`
   - Build arg `NEXT_PUBLIC_API_URL` = `https://YOUR-BACKEND.onrender.com/api/v1`
4. Set `CORS_ORIGIN` on backend to your frontend URL

---

## Environment variables checklist

| Variable | Where | Notes |
|----------|-------|-------|
| `JWT_SECRET` | backend | Required in production |
| `JWT_REFRESH_SECRET` | backend | Required in production |
| `DATABASE_URL` | backend | Auto-set by Docker Compose / cloud DB |
| `REDIS_URL` | backend | Auto-set by Docker Compose / cloud Redis |
| `CORS_ORIGIN` | backend | Your frontend URL |
| `NEXT_PUBLIC_API_URL` | web (build) | `/api/v1` if proxied, or full backend URL |
| `API_PROXY_TARGET` | web (build) | `http://backend:3001` in Docker Compose |
| `BILLING_ENABLED` | both | Keep `false` for free launch |

See `backend/.env.example` and `web/.env.local.example` for the full list.

---

## Verify deployment

```bash
# Swagger API docs
curl https://yourdomain.com/api/docs
```

Register a test account at `https://yourdomain.com/register`.

---

## Local Docker test (optional)

If you install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows:

```powershell
cd c:\Users\Admin\Desktop\savingsapp
copy .env.production.example .env
# Edit .env with secrets
docker compose up -d --build
```

Then open http://localhost:3000

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Registration fails / 500 | Check `docker compose logs backend` — usually DB not ready or bad `DATABASE_URL` |
| CORS errors | `CORS_ORIGIN` must exactly match your browser URL (scheme + domain, no trailing slash) |
| API 404 from frontend | Ensure `NEXT_PUBLIC_API_URL=/api/v1` and `API_PROXY_TARGET` points to backend |
| Migrations failed | `docker compose exec backend npx prisma migrate deploy` |
