# Edle Voucher Generator Web App

Production-ready **Next.js 16 + TypeScript** portal for Edle Bingo voucher management with **PostgreSQL**, **JWT authentication**, role-based access, real-time inbox, and bilingual UI.

## Stack

- **Frontend:** Next.js App Router, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT in HTTP-only cookies (bcrypt password hashing)

## Project Structure

```
src/
  app/                 # Pages & API routes
  components/          # Reusable UI
  contexts/            # Theme & i18n providers
  lib/                 # Auth, DB, money utils, i18n
prisma/
  schema.prisma        # Database schema
  seed.ts              # Default owner/agent seed
public/
  images/              # Login branding
  downloads/           # EDLE_BINGO.exe & Node.js installer
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/edle_voucher?schema=public"
   JWT_SECRET="use-a-long-random-string-at-least-32-characters"
   JWT_EXPIRES_IN="7d"
   ```

3. **Create database & tables**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Add download files** (optional)
   - Place `EDLE_BINGO.exe` in `public/downloads/`
   - Place Node.js installer as `public/downloads/nodejs-installer.msi`

5. **Run development server**
   ```bash
   npm run dev
   ```

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Owner (System Admin) | `Owner` | `1234` |
| Agent | `agent1` | `1234` |
| Download portal | `downloads` | `downloads123` |

> Change all default passwords immediately in production.

## Roles & Routes

| Role | Login result | Dashboard |
|------|--------------|-----------|
| Owner | JWT cookie | `/dashboard/owner` |
| Agent | JWT cookie | `/dashboard/agent` |
| Download user | JWT cookie | `/dashboard/downloads` |

Routes are protected by middleware — **no URL-based access** (e.g. `/owner` redirects to login without a valid JWT).

## Features

- Split login page matching Edle Bingo branding (“Sign in to your portal”)
- Owner: agents, top-up, reports, settings, about-us content, download portal credentials
- Agent: voucher generation, client CRM, inbox
- **Copy button** on every voucher code
- **Large agent badges** in sidebar and tables
- **Dark / light theme** and **English / Amharic** language toggle
- **Inbox** with fonts, emoji stickers, PNG/JPG attachments, polling notifications
- **Client management** (agent CRUD, owner read-only + total spent)
- **Voucher amount fix:** uses `Decimal(14,2)` + transactional balance updates (fixes 400 → 397 drift)

## Desktop App Integration

Public API endpoints (no auth) for the bingo desktop app:

- `GET /api/vouchers/status?code=391-143-6825`
- `PUT /api/vouchers/mark-used` with `{ "code": "...", "redeemedBy": "..." }`

## Production

```bash
npm run build
npm start
```

Use a strong `JWT_SECRET`, HTTPS, and a managed PostgreSQL instance.
