import multer from 'multer';

// Use in-memory storage so buffers can be streamed directly to Cloudinary
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

export const uploadMedia = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PNG, JPG, WEBP, and SVG are supported.'));
    }
  },
});
