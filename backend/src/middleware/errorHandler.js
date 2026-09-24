import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError('The requested resource was not found.', 404));
}

// Express recognizes an error handler by its 4 parameters, so keep all 4.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // express.json() throws these when the request body is bad
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'The request body contains invalid JSON.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'The request body is too large.',
    });
  }

  // Errors we threw on purpose: safe to show the message
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Anything else is a bug or a system failure: log it, hide the details
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again.',
  });
}