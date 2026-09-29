# Anmol Enterprises — Production Deployment Guide

This guide covers deploying **Anmol Enterprises** to **Railway** with **Neon PostgreSQL**.

---

## 1. Architecture Overview

- **Frontend & Admin**: Next.js 14 (App Router)
- **Backend & APIs**: Express + Socket.io (real-time live order dispatch)
- **Unified Server**: Runs on a single process (`tsx server.ts`)
- **Database**: Serverless PostgreSQL via [Neon](https://neon.tech)
- **Host**: [Railway](https://railway.app) (Persistent server supports WebSockets / Socket.io)

---

## 2. Environment Variables Checklist

Set these variables in your **Railway Project Settings → Variables**:

| Variable | Description | Example / Source |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection URL | `postgresql://user:pass@ep-xxx.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Web server listening port | `3000` (or assigned by Railway `$PORT`) |
| `JWT_SECRET` | Secret for user & admin authentication | Strong random string (64+ chars) |
| `JWT_EXPIRY` | JWT token lifespan | `7d` |
| `NEXT_PUBLIC_APP_NAME` | Branding name | `Anmol Enterprises` |
| `NEXT_PUBLIC_APP_URL` | Live production URL | `https://your-domain.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://your-domain.up.railway.app` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | `https://your-domain.up.railway.app` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_live_...` (or test key) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | From Razorpay Dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public client key for checkout | `rzp_live_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `anmol-enterprises` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | From Cloudinary Console |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | From Cloudinary Console |
| `MSG91_AUTH_KEY` | MSG91 SMS gateway key | From MSG91 Dashboard |
| `MSG91_TEMPLATE_ID` | DLT approved SMS template ID | From MSG91 Dashboard |
| `MSG91_SENDER_ID` | Approved 6-character sender ID | `ANMOL` |

---

## 3. One-Click Railway Deployment

1. Go to [Railway](https://railway.app) and sign in.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository: `Anmol Enterprises`.
4. In the Railway dashboard for the service:
   - Go to **Variables** and paste all environment variables from `.env.example`.
   - Ensure `DATABASE_URL` matches your Neon connection string.
5. Railway will automatically detect `railway.json` and `Procfile`:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start`
   - Healthcheck Path: `/api/health`
6. Click **Generate Domain** under Settings → Networking to get your public HTTPS URL.
7. Update `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` in Railway Variables with your generated domain (must start with `https://`).

---

## 4. Razorpay Live Mode & Webhook Configuration (HTTPS Required)

Razorpay live transactions and asynchronous webhook delivery **strictly require a public HTTPS URL**.

1. **Dashboard Setup**:
   - Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Switch to **Live Mode** in the top header.
   - Navigate to **Settings → Webhooks → Add New Webhook**.
2. **Webhook Parameters**:
   - **Webhook URL**: `https://<your-production-domain>/api/webhooks/razorpay` (must be HTTPS)
   - **Secret**: Generate a random 32+ character string (e.g. using `openssl rand -hex 32`) and save it as `RAZORPAY_WEBHOOK_SECRET` in your Railway environment variables.
   - **Active Events**: Check `payment.captured` and `order.paid`.
3. **Live API Keys**:
   - Generate your Live Key ID (`rzp_live_...`) and Secret in **Settings → API Keys**.
   - Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Railway.

---

## 4. Database Setup & Migrations

To apply migrations to your Neon database from your local machine:
```bash
# Push schema changes or apply migrations
npx prisma migrate deploy

# Seed catalog & admin accounts
npx prisma db seed
```

---

## 5. Rollback Procedure

If a bad deployment occurs:
1. In Railway Dashboard, go to **Deployments** tab.
2. Find the previous stable build.
3. Click the three dots `...` → **Redeploy**.
4. Railway will instantaneously revert traffic to the previous stable container.

---

## 6. Default Admin Credentials

- **Admin Phone**: `9422070000`
- **Default Password**: `anmoladmin2026`
- **Staff Phone**: `9422070001`
- **Default Password**: `anmolstaff2026`
- **Admin Panel URL**: `/admin/products` or `/admin/orders`
