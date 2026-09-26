import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — generous for a few minutes of speech

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('audio/')) {
    cb(new AppError('Only audio files are supported.', 400));
    return;
  }
  cb(null, true);
}

const audioUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES, files: 1 },
}).single('audio');

// Same pattern as upload.middleware.js from Phase 4: run multer manually so
// its errors come out as our standard { success:false, message } shape.
export function handleAudioUpload(req, res, next) {
  audioUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Recording is too large. Maximum size is 10MB.', 400));
        }
        return next(new AppError('Audio upload failed. Please try again.', 400));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No audio recording was provided.', 400));
    }

    next();
  });
}