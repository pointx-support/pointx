import { Readable } from 'node:stream';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export type MediaFolder = 'logos' | 'templates' | 'tournaments' | 'avatars' | 'general';

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: MediaFolder = 'general',
  customPublicId?: string
): Promise<UploadResult> {
  const isCloudinaryConfigured = !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );

  // If Cloudinary is not configured (e.g. initial dev or test), return safe data URI / mock URL
  if (!isCloudinaryConfigured || env.isTest) {
    const base64 = buffer.toString('base64');
    const mockId = customPublicId || `pointx_${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const dataUrl = `data:image/png;base64,${base64}`;
    return {
      url: dataUrl,
      secureUrl: dataUrl,
      publicId: mockId,
      format: 'png',
      bytes: buffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pointx/${folder}`,
        public_id: customPublicId,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty response'));
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    // Stream the buffer to Cloudinary using standard Node Readable stream
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function deleteImage(publicId: string): Promise<{ success: boolean; result?: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || env.isTest) {
    return { success: true, result: 'mock_deleted' };
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return { success: res.result === 'ok' || res.result === 'not found', result: res.result };
  } catch (error) {
    console.error('[Cloudinary Delete Error]', error);
    return { success: false };
  }
}
