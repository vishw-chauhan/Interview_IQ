// Wraps an async controller so a rejected promise (including a thrown AppError)
// is passed to next(), which routes it to errorHandler.js instead of crashing.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}