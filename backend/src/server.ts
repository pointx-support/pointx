import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { ensureSuperAdminAccount } from './services/adminService';
import { setupRealtimeSyncServer } from './services/realtimeSync';
import { migrateExistingTemplates } from './services/templateService';
import { runTenantMigration } from './services/tenantMigrationService';

async function startServer() {
  try {
    // 1. Initialize Express Application & Start Listening Immediately
    const app = createApp();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 PointX Esports Backend Server Running in ${env.NODE_ENV.toUpperCase()} mode`);
      console.log(`📡 Port: ${env.PORT} (Bound to 0.0.0.0 for Render production compatibility)`);
      console.log(`🛡  Security: Helmet, Rate-limiting, CORS, NoSQL Sanitizer Active`);
      console.log(`☁️  Cloudinary: ${env.CLOUDINARY_CLOUD_NAME ? 'Active' : 'Dev Mock'}`);
      console.log(`📬 Brevo Email: ${env.BREVO_API_KEY ? 'Active' : 'Dev Mock'}`);
      console.log(`======================================================\n`);
    });

    // 1b. Attach Real-Time WebSocket Synchronization Server
    setupRealtimeSyncServer(server);

    // 2. Resilient Background Database Connection & Migrations
    async function initializeDatabaseAndMigrations() {
      let attempt = 0;
      const maxRetries = 20;

      while (attempt < maxRetries) {
        try {
          attempt++;
          await connectDB();
          console.log(`🗄  Database: MongoDB Connected successfully`);

          try {
            await ensureSuperAdminAccount();
          } catch (adminErr) {
            console.error('[Bootstrap Admin Error]', adminErr);
          }

          try {
            const tenantStats = await runTenantMigration();
            console.log(`🏢 [Tenant Migration] Complete: ${tenantStats.usersMigrated} users, ${tenantStats.tournamentsMigrated} tournaments, ${tenantStats.teamsMigrated} teams updated.`);
          } catch (mErr) {
            console.error('[Tenant Migration Error]', mErr);
          }

          try {
            const migrationResult = await migrateExistingTemplates();
            if (migrationResult.migrated > 0 || migrationResult.needsReview > 0) {
              console.log(`🎨 [Template Migration] Migrated: ${migrationResult.migrated}, Needs Review: ${migrationResult.needsReview}`);
            }
          } catch (tErr) {
            console.error('[Template Migration Error]', tErr);
          }

          return; // Connected and bootstrapped!
        } catch (err: any) {
          const delay = Math.min(2000 * Math.pow(1.3, attempt), 20000);
          console.warn(`[Database Connection Notice] Attempt ${attempt} failed: ${err.message || err}. Reconnecting in ${Math.round(delay / 1000)}s...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      console.error(`[Database Critical] Could not connect to MongoDB after ${maxRetries} attempts. HTTP server is still alive for health checks.`);
    }

    initializeDatabaseAndMigrations().catch((err) => {
      console.error('[Database Initialization Exception]', err);
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed all connections. Exiting process.');
        process.exit(0);
      });

      // Force exit if hanging
      setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server Startup Failed]', error);
    process.exit(1);
  }
}

startServer();
