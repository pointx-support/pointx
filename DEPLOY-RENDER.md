# PointX Esports Operating System — Render Production Deployment Guide

This guide provides the exact, production-verified instructions to deploy the complete **PointX Full-Stack Application (Frontend + Backend + MongoDB Atlas + Cloudinary + Brevo + OBS Live Engine)** onto [Render](https://render.com).

---

## 1. Selected Architecture: Single Render Web Service (Recommended)

### Why this architecture?
The PointX platform is structured as a high-performance monorepo (`frontend/` React 19 + Vite SPA and `backend/` Express Node.js engine):

- **Same-Origin Architecture**: In production, the Express backend serves the optimized frontend build (`frontend/dist/`) and all API endpoints (`/api/*`) on the **same domain and port**.
- **Zero CORS Friction**: Eliminates cross-origin credentials issues and browser third-party cookie restrictions (Safari, Chrome Incognito, iOS).
- **Single Service Economy**: Runs the entire platform on a single Render Web Service (Free or Starter tier), eliminating synchronization delays between separate deployments.
- **Large Asset Streaming**: The home page hero background video (`bgvideo.mp4` ~107MB) is served directly with HTTP 206 Partial Content range requests, bypassing Render Static Site file size limitations.
- **SPA Deep Linking**: Native SPA fallback routes all client paths (`/login`, `/signup`, `/super-admin/login`, `/super-admin`, `/dashboard`, etc.) directly to `index.html` while preserving 404 JSON responses for unknown `/api/*` requests.

*(Note: If you ever prefer two separate Render services, the frontend `api.ts` also natively supports `VITE_API_BASE_URL` pointing to an external backend URL).*

---

## 2. Quick Deploy via Render Blueprint (`render.yaml`)

This repository includes a production-ready `render.yaml` blueprint.

1. Push your code to your GitHub / GitLab repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your PointX repository.
5. Render will automatically parse `render.yaml`, pre-configure the build command, start command, health check path, and prompt you to fill in your secure environment variables.

---

## 3. Manual Deployment Setup (Step-by-Step)

If you prefer creating the service manually without the Blueprint:

### Step A: Create the Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repo.
3. Configure the following **exact settings**:

| Field | Value | Notes |
|---|---|---|
| **Name** | `pointx-esports` | Or your preferred service name |
| **Region** | `Oregon (US West)` or closest | Choose closest to your MongoDB cluster |
| **Branch** | `main` | Or your active branch |
| **Root Directory** | *(Leave blank)* | Default root of the repository |
| **Runtime** | `Node` | Node.js environment |
| **Build Command** | `npm install && npm run build` | Installs dependencies & builds frontend |
| **Start Command** | `npm start` | Runs `tsx backend/src/server.ts` |
| **Instance Type** | `Free` or `Starter` | Starter recommended for no cold-sleep |

### Step B: Configure Health Check Path
Under **Advanced Settings**:
- **Health Check Path**: `/api/health` (or `/health`)
- *Render will poll this endpoint during deployments and ensure zero-downtime rollouts.*

---

## 4. Environment Variables Specification

Under the **Environment** tab of your Render service, add the following environment variables:

| Variable Name | Required | Example / Description |
|---|---|---|
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | Auto | `10000` *(Render sets this automatically; backend binds to `0.0.0.0`)* |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/pointx?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | A strong random string (e.g. `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | Optional | `7d` *(Default: 7 days)* |
| `SUPER_ADMIN_USERNAME` | Optional | `admin` *(Default: `admin`)* |
| `SUPER_ADMIN_PASSWORD` | **Yes** | Your secure Super Admin password (e.g. `YourSecretPassword123!`) |
| `BREVO_API_KEY` | Optional | `xkeysib-xxxx...` *(From Brevo → SMTP & API Keys)* |
| `BREVO_SENDER_EMAIL` | Optional | `support@pointx.gg` *(Verified sender email in Brevo)* |
| `BREVO_SENDER_NAME` | Optional | `PointX Esports Arena` |
| `CLOUDINARY_CLOUD_NAME`| Optional | `your_cloud_name` *(From Cloudinary Console)* |
| `CLOUDINARY_API_KEY` | Optional | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Optional | `your_api_secret` |
| `CLOUDINARY_FOLDER` | Optional | `pointx` |

> ⚠️ **SECURITY WARNING**: Never commit your real credentials or `.env` file to Git. Only paste them directly into Render's Environment Variables dashboard.

---

## 5. External Services Configuration

### 1. MongoDB Atlas Configuration
Because Render uses dynamic outbound IP addresses:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. In the left navigation, go to **Security** → **Network Access**.
3. Click **Add IP Address**.
4. Select **Allow Access from Anywhere** (`0.0.0.0/0`) and click **Confirm**.
5. Ensure your Database User has **Read and write to any database** privileges on your target database.

### 2. Brevo (Sendinblue) Configuration
1. Log in to [Brevo](https://app.brevo.com).
2. Navigate to **Account** → **SMTP & API** → **API Keys**.
3. Generate an API Key (v3) and paste it into `BREVO_API_KEY`.
4. Ensure your `BREVO_SENDER_EMAIL` is verified in Brevo under **Senders, Domains & Dedicated IPs**.

### 3. Cloudinary CDN Configuration
1. Log in to [Cloudinary](https://cloudinary.com/console).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Paste them into the corresponding variables in Render.

---

## 6. Post-Deployment Verification Checklist

Once Render marks the deployment as **Live**, verify each layer:

1. **System Health Check**:
   - Open: `https://your-service.onrender.com/api/health`
   - Expect: HTTP 200 OK with `{"success":true,"status":"healthy","services":{"database":"connected",...}}`

2. **Landing Page & Background Video**:
   - Open: `https://your-service.onrender.com/`
   - Expect: Landing page renders smoothly and `bgvideo.mp4` streams seamlessly in the hero section.

3. **Client-Side SPA Deep Links**:
   - Navigate directly to `https://your-service.onrender.com/login` and refresh the page.
   - Navigate directly to `https://your-service.onrender.com/super-admin/login` and refresh the page.
   - Expect: The React application renders the requested route without 404 errors.

4. **Super Admin Authentication**:
   - Go to `/super-admin/login`.
   - Sign in using your `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD`.
   - Expect: Successful authentication into the Super Admin Command Center, showing live metrics for MongoDB, Cloudinary, and Brevo.

5. **Organizer Sign Up & Login**:
   - Register a new account or sign in as an organizer.
   - Complete the onboarding modal and navigate to the tournament workspace.
   - Test generating a point table or opening the OBS Live stream overlay link.

---

## 7. Troubleshooting & FAQ

- **Issue**: Render deployment times out on health check.
  - **Fix**: Verify your MongoDB Atlas Network Access has `0.0.0.0/0` enabled. If MongoDB fails to connect, the server will log connection errors in the Render log viewer.
- **Issue**: Cold start delays on the Free tier.
  - **Fix**: Render Free tier web services spin down after 15 minutes of inactivity. For 24/7 continuous tournament uptime, upgrade the service to Render's **Starter** plan ($7/month).
- **Issue**: Local development workflow.
  - **Command**: Run `npm run dev` in your local terminal. The local Vite development server (`http://localhost:5173`) and Express backend (`http://localhost:5000`) will run concurrently with instant hot-reloading.
