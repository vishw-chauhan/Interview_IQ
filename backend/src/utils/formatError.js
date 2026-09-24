// Some connection errors (for example when PostgreSQL is not running) arrive
// with an empty message. This helper always returns something readable.
export function formatError(error) {
  if (!error) return 'Unknown error';
  if (error.message) return error.message;
  if (error.code) return error.code;
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return formatError(error.errors[0]);
  }
  return String(error);
}