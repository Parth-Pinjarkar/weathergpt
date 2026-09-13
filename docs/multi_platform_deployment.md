# WeatherGPT — Multi-Platform Production Deployment Guide

Deploy WeatherGPT across specialized free/serverless platforms:
- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (Serverless PostgreSQL)
- **Backend**: [Railway](https://railway.app), [Koyeb](https://www.koyeb.com), or [Render](https://render.com) (FastAPI Python Service)
- **Frontend**: [Vercel](https://vercel.com) (Next.js Edge / Serverless)

---

## Architecture Overview

```
 ┌────────────────┐          HTTPS           ┌──────────────────────┐
 │     Vercel     │ ───────────────────────> │  Railway / Koyeb     │
 │  Next.js App   │ <─────────────────────── │  FastAPI Backend     │
 └────────────────┘                          └──────────┬───────────┘
                                                        │ Connection
                                                        │ Pool (SSL)
                                                        ▼
                                             ┌──────────────────────┐
                                             │   Neon / Supabase    │
                                             │   PostgreSQL DB      │
                                             └──────────────────────┘
```

---

## Step 1: Deploy Database (Neon or Supabase)

### Option A: Neon Serverless PostgreSQL (Recommended)
1. Sign up at [neon.tech](https://neon.tech) (Free tier includes 0.5 GB storage, autoscaling).
2. Click **Create Project** -> Name it `weathergpt`.
3. Copy the **Connection String** provided on the dashboard:
   ```text
   postgresql://alex:AbC123xyz@ep-weather-123456.us-east-2.aws.neon.tech/weathergpt?sslmode=require
   ```
4. Save this URL for Step 2 as `DATABASE_URL`.
*(Note: WeatherGPT's database engine automatically creates all required tables on initial startup.)*

---

## Step 2: Deploy Backend (Railway or Koyeb)

### Option A: Railway (Fastest setup)
1. Log in to [railway.app](https://railway.app) with your GitHub account.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `innocentgaming/weathergpt-ai`.
4. Under **Settings**:
   - **Root Directory**: Set to `/backend`.
   - **Build Command**: `pip install -r requirements.txt` (or leave default auto-detected via Procfile).
5. Under **Variables**, add the following environment variables:
   | Variable | Value |
   |---|---|
   | `PORT` | `8000` |
   | `DATABASE_URL` | *(Your Neon/Supabase PostgreSQL connection string from Step 1)* |
   | `ALLOWED_ORIGINS` | `http://localhost:3000,https://your-vercel-domain.vercel.app` *(update once Vercel is deployed)* |
   | `DEMO_MODE` | `False` |
   | `JWT_SECRET_KEY` | *(Generate a 32-byte random string or use `openssl rand -hex 32`)* |
   | `WEATHER_PROVIDER` | `openmeteo` |
   | `GEMINI_API_KEY` | *(Optional - if using Gemini for chat/photo analysis)* |
   | `OPENROUTER_API_KEY` | *(Optional)* |
6. In **Settings -> Networking**, click **Generate Domain** (e.g. `https://weathergpt-backend-production.up.railway.app`).
7. Test the health check endpoint:
   `https://your-backend.up.railway.app/health` -> should return `{"status":"healthy","service":"weathergpt-api"}`.

### Option B: Koyeb
1. Go to [koyeb.com](https://app.koyeb.com) -> **Create App**.
2. Source: **GitHub**, choose `innocentgaming/weathergpt-ai`.
3. Work directory: `backend`.
4. Builder: **Buildpack** (or Dockerfile in `backend/Dockerfile`).
5. Configure Environment Variables identical to Railway above.

---

## Step 3: Deploy Frontend (Vercel)

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import the `weathergpt-ai` repository.
4. In the configuration screen:
   - **Framework Preset**: Next.js (auto-detected).
   - **Root Directory**: Click *Edit* and select `frontend`.
5. Expand **Environment Variables** and add:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` *(from Step 2)* |
   | `NEXT_PUBLIC_WS_URL` | `wss://your-backend.up.railway.app` *(from Step 2)* |
6. Click **Deploy**.
7. Vercel will build and assign your domain (e.g. `https://weathergpt-ai.vercel.app`).

---

## Step 4: Final Link (CORS Handshake)

Once your Vercel URL is live:
1. Go back to your Backend Dashboard (**Railway / Koyeb**).
2. Update the `ALLOWED_ORIGINS` environment variable to include your new Vercel domain:
   ```text
   ALLOWED_ORIGINS=https://weathergpt-ai.vercel.app,http://localhost:3000
   ```
3. Restart or redeploy the backend service so it applies the new CORS origin.
