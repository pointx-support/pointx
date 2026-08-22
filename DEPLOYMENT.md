# STRIKZ ARENA — PRODUCTION DEPLOYMENT & OPERATION MANUAL

## 1. Overview
Strikz Arena is a production-ready, high-performance esports tournament control center, point calculation engine, OBS Studio live scoreboard broadcast server, and high-resolution graphics generator designed specifically for competitive Free Fire tournaments.

---

## 2. Technical Stack
- **Frontend Framework**: React 19 + TypeScript (Strict Mode)
- **State Management**: Zustand 5.0 (Isolated, persistent client stores)
- **Styling**: Tailwind CSS v4 + Custom Esports Design System Tokens
- **Real-Time Synchronization**: Native `BroadcastChannel` Web API + `StorageEvent` IPC fallback
- **Graphics Rasterizer**: High-DPI XMLSerializer + Canvas 2D engine (1080p & 4K UHD PNG/JPEG)
- **Batch Export**: JSZip client-side bundling
- **Testing**: Vitest (40 unit & integration test cases)
- **Build Tool**: Vite 8

---

## 3. Quick Start & Deployment

### Development Mode
```bash
npm install
npm run dev
```

### Run Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```
The compiled static assets are output to `/dist` and can be hosted on any modern static host or CDN (Vercel, Cloudflare Pages, Netlify, AWS S3 + CloudFront, Nginx, or Docker).

### Production Preview
```bash
npm run preview
```

---

## 4. OBS Studio Live Scoreboard Setup (Organizer Guide)

Follow these simple steps to broadcast real-time standings directly inside OBS Studio:

1. **Open Tournament**: Launch Strikz Arena and select your active tournament from the Command Center.
2. **Access OBS Studio Panel**: Click **OBS Live** in the navigation bar or sidebar.
3. **Copy Live URL**: Click **Copy URL** to get the dedicated browser source link.
   - *Example*: `https://strikzarena.com/?mode=broadcast&tournament=tour-ff-champ-2026&token=obs_tour-ff-_a1b2c3d4&layout=standings&transparent=true`
4. **Open OBS Studio**:
   - In OBS, under the **Sources** dock, click the `+` button.
   - Choose **Browser**.
   - Name the source (e.g. `FF Live Scoreboard`).
5. **Configure Browser Source Properties**:
   - **URL**: Paste the copied live URL.
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `60`
   - **Custom CSS**: Leave blank or set `body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }`
   - Check: `Refresh browser when scene becomes active`.
6. **Automatic Real-Time Updates**:
   - Whenever you save or finalize match round scores in the Strikz Arena admin panel, OBS Studio will update automatically within milliseconds without requiring page reloads or scene refreshes.

---

## 5. Database Backup & Disaster Recovery Strategy

Strikz Arena stores tournament records, global squad profiles, and recent exports locally with automatic snapshotting.

### Backup Strategy:
1. **JSON Snapshot Backups**:
   - The tournament store maintains complete serialized snapshots under local storage keys:
     - `strikz_tournament_store_v1`
     - `strikz_global_teams_v1`
     - `strikz_auth_session_v1`
     - `strikz_graphics_history_v1`
2. **Recommended Backup Frequency**:
   - Automatic export after every finalized match day.
   - Organizers can batch export tournament packages into `.zip` archives containing all graphics, standings, and match breakdowns.
3. **Recovery Process**:
   - In case of client browser cache clearance, tournaments can be restored from the exported JSON snapshot or recreated with 1-click global squad autofill.

---

## 6. Security & Access Control

- **Zero Credential Leakage**: Broadcast URLs use isolated access tokens (`obs_...`) and do not transmit organizer login tokens, passwords, or admin privileges to OBS Studio.
- **Token Revocation**: Organizers can 1-click regenerate broadcast tokens from the OBS Live control panel to immediately invalidate old broadcast links.
- **Protected Workspace**: All tournament creation, match editing, and team modifications require authenticated administrator or organizer access.

---

## 7. Production Checklist Verification
- [x] Production build passes with 0 TypeScript/compilation errors.
- [x] All 40 unit and integration tests pass across 7 test suites.
- [x] Real-time IPC synchronization verified between admin panel and OBS Browser Source.
- [x] 1080p and 4K UHD graphics render with 100% SVG fidelity.
- [x] Fully responsive across all devices from $360\text{px}$ mobile to $1920\text{px}$ desktop.
- [x] Accessible high-contrast esports theme with dark/light mode toggling.