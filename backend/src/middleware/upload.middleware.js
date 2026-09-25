import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/resumes');

// Created once, on server start. Safe to call even if it already exists.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Random name on disk avoids collisions and path-traversal risk from
    // user-supplied filenames. The real filename is kept in the database.
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Only PDF, DOC and DOCX files are supported.', 400));
    return;
  }
  cb(null, true);
}

const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
}).single('resume');

// Wraps multer so its errors (wrong type, too large, etc.) come out as
// the same { success:false, message } shape as every other API error.
export function handleResumeUpload(req, res, next) {
  resumeUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File is too large. Maximum size is 5MB.', 400));
        }
        return next(new AppError('File upload failed. Please try again.', 400));
      }
      return next(err); // AppError thrown from fileFilter, or something unexpected
    }

    if (!req.file) {
      return next(new AppError('Please select a resume file to upload.', 400));
    }

    next();
  });
}