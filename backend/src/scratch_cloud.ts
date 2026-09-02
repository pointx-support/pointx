import { v2 as cloudinary } from 'cloudinary';
import { env } from './config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  try {
    const raw = await cloudinary.api.usage();
    console.log('=== RAW CLOUDINARY USAGE OBJECT ===');
    console.log(JSON.stringify(raw, null, 2));
  } catch (err) {
    console.error('Cloudinary API Error:', err);
  }
}

main();
