# GoalNest local setup

## Why registration fails (404 / 500 / Network Error)

| Error | Cause |
|-------|--------|
| Network Error | Backend not running on port **3001** |
| 404 | Frontend on wrong port (**3001**) or backend not running |
| 500 | **PostgreSQL** not running or wrong credentials |

## Quick start

### 1. Database (PostgreSQL)

**Option A — Docker (recommended)**

```powershell
cd c:\Users\Admin\Desktop\savingsapp
docker compose up -d postgres redis
```

**Option B — Local PostgreSQL (Windows)**

If you see `P1010: User goalnest was denied access`, run this once (uses your installed Postgres as admin):

```powershell
cd c:\Users\Admin\Desktop\savingsapp
.\scripts\setup-db-windows.ps1
```

Or manually in pgAdmin / `psql` as user `postgres`:

```sql
CREATE ROLE goalnest WITH LOGIN PASSWORD 'goalnest_dev_password' CREATEDB;
CREATE DATABASE goalnest OWNER goalnest;
GRANT ALL ON SCHEMA public TO goalnest;
ALTER SCHEMA public OWNER TO goalnest;
```

Then: `cd backend` → `npx prisma migrate deploy`

Or set `DATABASE_URL` in `backend/.env` to your existing Postgres admin user, for example:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/goalnest?schema=public
```

### 2. Run migrations

```powershell
cd backend
npm run prisma:migrate
```

### 3. Start backend (port 3001)

```powershell
cd backend
npm run start:dev
```

Check: http://localhost:3001/api/docs (Swagger UI)

### 4. Start frontend (port 3000 only)

```powershell
cd web
npm run dev
```

Open: http://localhost:3000/register

## Where account data is stored

- **Database:** PostgreSQL `goalnest` on `localhost:5432`
- **Tables:** `users`, `user_profiles`, `refresh_tokens`
- **View data:** `cd backend` then `npx prisma studio` → http://localhost:5555

Passwords are stored as bcrypt hashes, not plain text.
