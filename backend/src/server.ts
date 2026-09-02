import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { ensureSuperAdminAccount } from './services/adminService';
import { setupRealtimeSyncServer } from './services/realtimeSync';

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

    // 2. Connect Database & Ensure Super Admin in background
    connectDB()
      .then(async () => {
        console.log(`🗄  Database: MongoDB Connected successfully`);
        await ensureSuperAdminAccount();
      })
      .catch((err) => {
        console.error('[Database Connection Warning]', err);
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
