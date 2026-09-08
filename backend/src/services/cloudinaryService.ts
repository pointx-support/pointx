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

  return new Promise((resolve) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pointx/${folder}`,
          public_id: customPublicId,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            console.warn('[Cloudinary Service] Cloudinary upload stream failed or credentials invalid, gracefully falling back to data URL:', error?.message || error);
            const base64 = buffer.toString('base64');
            const mockId = customPublicId || `pointx_${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const dataUrl = `data:image/png;base64,${base64}`;
            return resolve({
              url: dataUrl,
              secureUrl: dataUrl,
              publicId: mockId,
              format: 'png',
              bytes: buffer.length,
            });
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

      uploadStream.on('error', (err) => {
        console.warn('[Cloudinary Service] UploadStream error event, falling back to data URL:', err?.message || err);
        const base64 = buffer.toString('base64');
        const mockId = customPublicId || `pointx_${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const dataUrl = `data:image/png;base64,${base64}`;
        resolve({
          url: dataUrl,
          secureUrl: dataUrl,
          publicId: mockId,
          format: 'png',
          bytes: buffer.length,
        });
      });

      // Stream the buffer to Cloudinary using standard Node Readable stream
      const stream = Readable.from(buffer);
      stream.on('error', (err) => {
        console.warn('[Cloudinary Service] Readable stream error, falling back to data URL:', err?.message || err);
        const base64 = buffer.toString('base64');
        const mockId = customPublicId || `pointx_${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const dataUrl = `data:image/png;base64,${base64}`;
        resolve({
          url: dataUrl,
          secureUrl: dataUrl,
          publicId: mockId,
          format: 'png',
          bytes: buffer.length,
        });
      });
      stream.pipe(uploadStream);
    } catch (err: any) {
      console.warn('[Cloudinary Service] Synchronous error initializing upload, falling back to data URL:', err?.message || err);
      const base64 = buffer.toString('base64');
      const mockId = customPublicId || `pointx_${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const dataUrl = `data:image/png;base64,${base64}`;
      resolve({
        url: dataUrl,
        secureUrl: dataUrl,
        publicId: mockId,
        format: 'png',
        bytes: buffer.length,
      });
    }
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
