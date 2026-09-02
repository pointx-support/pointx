import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { env } from './config/env';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[DB] Connected to MongoDB');

  const admin = await User.findOne({ $or: [{ role: 'admin' }, { email: 'admin@pointx.gg' }, { name: 'admin' }] });
  if (!admin) {
    console.error('Super Admin user not found in DB!');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  admin.passwordHash = await bcrypt.hash('Universe00@@', salt);
  admin.role = 'admin';
  await admin.save();

  console.log('✅ Super Admin password in database successfully set to "Universe00@@"');
  await mongoose.disconnect();
}

main().catch(console.error);
