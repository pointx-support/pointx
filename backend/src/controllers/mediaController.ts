import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadImageBuffer, deleteImage, MediaFolder } from '../services/cloudinaryService';

export async function uploadMediaFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    // Check for SVG XSS / script injection
    const mime = req.file.mimetype;
    const name = req.file.originalname?.toLowerCase() || '';
    if (mime === 'image/svg+xml' || name.endsWith('.svg')) {
      const svgContent = req.file.buffer.toString('utf-8');
      if (/<script|javascript:|onload|onerror|onclick|<iframe|<object|<embed|<foreignObject/i.test(svgContent)) {
        return res.status(400).json({
          success: false,
          error: 'SVG contains forbidden scripts, event handlers, or embedded executable objects.',
        });
      }
    }

    const folder = (req.body.folder as MediaFolder) || 'general';
    const allowedFolders: MediaFolder[] = ['logos', 'templates', 'tournaments', 'avatars', 'general'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ success: false, error: 'Invalid media folder.' });
    }

    let customPublicId = req.body.publicId as string | undefined;
    if (customPublicId) {
      // Prevent path traversal
      if (!/^[a-zA-Z0-9_\-]+$/.test(customPublicId)) {
        return res.status(400).json({ success: false, error: 'Invalid publicId characters.' });
      }
    }

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
    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ success: false, error: 'Public ID is required.' });
    }

    // Prevent path traversal
    if (publicId.includes('..') || !/^[a-zA-Z0-9_\-\/]+$/.test(publicId)) {
      return res.status(400).json({ success: false, error: 'Invalid public ID format.' });
    }

    // Protect core system brand assets from non-admin deletion
    if (publicId.startsWith('pointx/brand') || publicId.startsWith('brand/')) {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Permission denied. Core brand assets cannot be deleted.' });
      }
    }

    const result = await deleteImage(publicId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
