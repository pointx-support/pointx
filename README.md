# PointX Esports Operating System (Enterprise Full-Stack)

> **The Ultimate Battle Royale Esports Management, Real-Time Scoring Matrix & OBS Broadcast Engine**  
> Built for Free Fire Tournament Organizers, Broadcast Producers, and Professional Esports Networks.

---

## 🌟 Full-Stack Architecture Overview

PointX is a production-grade full-stack platform consisting of:

1. **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Zustand 5
2. **Backend**: Express 5 (TypeScript / tsx) + Mongoose ODM + Zod Validation
3. **Database**: MongoDB (Atlas or Self-Hosted) with TTL indexes, schema validation, and session tracking
4. **Email Delivery**: Brevo (formerly Sendinblue) Transactional API for 6-digit OTP verification, password reset, and security alerts
5. **Media Storage**: Cloudinary server-side buffered streaming with zero unencrypted disk footprint
6. **OBS & Remote Sync**: Real-time LAN Wi-Fi sync, BroadcastChannel, and HTTP polling for live broadcast HUD overlays

---

## 🚀 Key Features

### 🔐 1. Enterprise Security & Authentication (Brevo Email Integration)
- **6-Digit Brevo Email OTP Verification**:
  - New registrations require OTP verification before activation.
  - OTPs are cryptographically hashed via SHA-256 (`hashToken`) and stored in MongoDB with automatic TTL expiry (10 minutes).
  - Resend throttling with a 60-second cooldown window.
  - Brute force protection: automatic lockout after 5 consecutive incorrect attempts.
- **Forgot Password Workflow**:
  - OTP delivery via Brevo with instant session invalidation and automated email security alerts on credential changes.
- **Active Session Management**:
  - Remote session tracking (IP address, browser, device type) with one-click remote session termination.
- **Defensive API Hardening**:
  - `Helmet` security headers, strict `CORS`, custom NoSQL query sanitization, and IP rate limiters (`express-rate-limit`).

### ☁️ 2. Cloudinary Media Processing
- Server-side memory stream upload (`multer.memoryStorage()`) piped directly to Cloudinary.
- Strict MIME type verification (PNG, JPEG, WEBP, SVG) and configurable payload limits (10MB).
- Structured asset folder hierarchy:
  - `pointx/logos`: Tournament & organizer branding
  - `pointx/templates`: Custom Graphics Studio canvas backgrounds
  - `pointx/tournaments`: High-resolution banners
  - `pointx/avatars`: User profiles

### 🏆 3. Tournament Operating System & Live Scoring Matrix
- Automated Free Fire 12-Slot / 24-Team scoring calculations (Booyah bonus, placement points, kill points, tie-breakers).
- Instant live standings updates across matches with historical audit trail.
- Tournament cloning, JSON batch import/export, and team roster database.

### 🎨 4. Graphics Studio (16:9 & 4:5 Poster Renderers)
- 4K / High-DPI canvas rasterization with SVG badge generators.
- Custom template creation with drag-and-drop layer reordering.
- ZIP package batch export and historical export records stored in MongoDB.

### 📡 5. OBS Broadcast HUD & Remote Control
- Zero-latency broadcast overlay at `/?mode=broadcast&tournamentId=<id>` for OBS Browser Source.
- Mobile organizer remote at `/?mode=remote&tournamentId=<id>` with real-time LAN Wi-Fi sync.

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/pointx_db`) or MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/shakti69/pointx.git
cd pointx

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend HTTP Port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb://127.0.0.1:27017/pointx_db` |
| `JWT_SECRET` | Secret key for signing session tokens | `<64-byte-hex-string>` |
| `BREVO_API_KEY` | Brevo API key for transactional emails | `xkeysib-...` (Leave empty for Dev Mock) |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo | `noreply@pointx.gg` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `...` (Leave empty for Dev Mock) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `...` |

*(Note: When `BREVO_API_KEY` or `CLOUDINARY_*` are omitted, PointX automatically operates in Development Mock Mode, printing verification OTPs to console and generating local data URLs).*

### 4. Running the Development Server
```bash
# Runs frontend (Vite :5173) and backend (Express :5000) concurrently
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

PointX features a test suite covering frontend calculation engines, permissions, Brevo OTP flows, Cloudinary streams, and role-gated admin APIs:

```bash
# Run all frontend & backend test suites
npm run test

# Run backend API & integration tests specifically
npm run test:server
```

---

## 📚 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register organizer account (issues 6-digit Brevo OTP)
- `POST /api/auth/verify-otp` — Verify OTP & activate account
- `POST /api/auth/resend-otp` — Resend verification code (60s cooldown)
- `POST /api/auth/login` — Sign in with email/password
- `POST /api/auth/logout` — Terminate current session
- `GET  /api/auth/me` — Get authenticated user & active sessions
- `POST /api/auth/forgot-password` — Send password recovery OTP
- `POST /api/auth/reset-password` — Verify OTP and reset password
- `POST /api/auth/change-password` — Change password (requires auth)
- `POST /api/auth/terminate-sessions` — Revoke all other remote sessions

### Media & Cloudinary (`/api/media`)
- `POST /api/media/upload` — Multipart image upload (`logos`, `templates`, `tournaments`, `avatars`)
- `POST /api/media/delete` — Delete image by public ID

### Tournaments (`/api/tournaments`)
- `GET  /api/tournaments` — List organizer tournaments
- `POST /api/tournaments` — Create tournament
- `GET  /api/tournaments/:id` — Retrieve tournament details
- `PUT  /api/tournaments/:id` — Update tournament standings/matches
- `DELETE /api/tournaments/:id` — Delete tournament
- `POST /api/tournaments/clone` — Clone tournament with selective options
- `POST /api/tournaments/import` — Batch JSON import
- `GET  /api/tournaments/public/:id` — Public broadcast overlay data

### Global Squads & Rosters (`/api/teams`)
- `GET  /api/teams` — Search global team registry
- `POST /api/teams` — Create team
- `PUT  /api/teams/:id` — Update team
- `DELETE /api/teams/:id` — Delete team
- `POST /api/teams/:id/players` — Add player to squad roster
- `PUT  /api/teams/:id/players/:playerId` — Update player details
- `DELETE /api/teams/:id/players/:playerId` — Remove player from squad

### Platform Administration (`/api/admin`)
- `GET  /api/admin/users` — Directory of registered organizers (Admin only)
- `POST /api/admin/users/:id/suspend` — Suspend user account
- `POST /api/admin/users/:id/restore` — Restore suspended user
- `DELETE /api/admin/users/:id` — Delete user account
- `GET  /api/admin/settings` — Platform configuration & announcements
- `PUT  /api/admin/settings` — Update platform settings & maintenance mode
- `GET  /api/admin/audit-logs` — Platform-wide security audit trail

---

## 🏗️ Production Build & Deployment

```bash
# Build frontend client and run type checking
npm run build

# Start production server
NODE_ENV=production npm run server
```

---

## 📄 License
PointX Esports Tournament OS is proprietary software developed by **PointX Esports Network**. All rights reserved.
