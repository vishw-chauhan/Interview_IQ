import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return next(new AppError(firstIssue.message, 400));
    }

    req.body = result.data;
    next();
  };
}