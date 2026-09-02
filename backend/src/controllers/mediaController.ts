import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadImageBuffer, deleteImage, MediaFolder } from '../services/cloudinaryService';

export async function uploadMediaFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    const folder = (req.body.folder as MediaFolder) || 'general';
    const customPublicId = req.body.publicId as string | undefined;

    const uploadResult = await uploadImageBuffer(req.file.buffer, folder, customPublicId);

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secureUrl || uploadResult.url,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMediaFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, error: 'Public ID is required.' });
    }

    const result = await deleteImage(publicId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
