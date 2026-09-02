import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { ensureSuperAdminAccount } from './services/adminService';

async function startServer() {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Ensure Super Admin Account
    await ensureSuperAdminAccount();

    // 3. Initialize Express Application
    const app = createApp();

    // 3. Listen on Port & Host 0.0.0.0
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 PointX Esports Backend Server Running in ${env.NODE_ENV.toUpperCase()} mode`);
      console.log(`📡 Port: ${env.PORT} (Bound to 0.0.0.0 for Render production compatibility)`);
      console.log(`🛡  Security: Helmet, Rate-limiting, CORS, NoSQL Sanitizer Active`);
      console.log(`🗄  Database: MongoDB Connected`);
      console.log(`☁️  Cloudinary: ${env.CLOUDINARY_CLOUD_NAME ? 'Active' : 'Dev Mock'}`);
      console.log(`📬 Brevo Email: ${env.BREVO_API_KEY ? 'Active' : 'Dev Mock'}`);
      console.log(`======================================================\n`);
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
