# Deploying Anmol Enterprises to Render.com (100% Free)

This guide takes ~3 minutes to launch your application live on the web with a free `https://...` address.

---

## Step 1: Sign in to Render.com with GitHub
1. Open [dashboard.render.com](https://dashboard.render.com/).
2. Click **Sign in with GitHub** using your account (`00mrsumit00`).

---

## Step 2: Create a New Web Service
1. Click the **"New +"** button in the top navigation bar.
2. Select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and click **Next**.
4. Find and click **Connect** next to `00mrsumit00/anmol-enterprises`.
   *(If not listed, click "Configure account" to grant Render access to your repository).*

---

## Step 3: Configure Settings
Fill in the following fields:

| Field | Value |
| :--- | :--- |
| **Name** | `anmol-enterprises` |
| **Region** | `Singapore` (Fastest for India) or `Oregon` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | **Free** ($0/month) |

---

## Step 4: Add Environment Variables
Scroll down to the **"Environment Variables"** section and add the following keys:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_2H6emhuSzMXC@ep-tiny-term-axhnb03n.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `anmol-enterprises-latur-mccain-distributor-super-secret-jwt-key-2026-at-least-64-chars` |
| `JWT_EXPIRY` | `7d` |
| `NEXT_PUBLIC_APP_NAME` | `Anmol Enterprises` |
| `RAZORPAY_KEY_ID` | `rzp_test_mock_123456` |
| `RAZORPAY_KEY_SECRET` | `mock-razorpay-secret` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_mock_123456` |

*(Once Render generates your free domain, e.g. `https://anmol-enterprises.onrender.com`, set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` to that domain).*

---

## Step 5: Click "Create Web Service"
- Render will start building the Next.js application, generating Prisma client, and starting the Socket.IO server.
- Within 2-3 minutes, your status will turn **Live (Green)**!
- You can now open your URL and test with any smartphone or desktop.
