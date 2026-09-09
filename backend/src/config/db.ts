import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

// Attach persistent connection state listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log(`[MongoDB] Active connection established: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[MongoDB] Runtime connection error:', err.message || err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Connection lost. Driver will automatically attempt reconnection.');
});

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (isDatabaseConnected()) {
    isConnected = true;
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true, // Ensure indexes are built in production
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    isConnected = false;
    console.error(`[MongoDB] Connection failed: ${error.message || error}`);
    // DO NOT process.exit(1) in production! Allow the HTTP server to remain alive so /api/health responds
    // and Render does not enter an infinite container restart loop.
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected cleanly.');
}
