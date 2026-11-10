import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

// Which parts of the request can be validated, and the zod schema for each
interface Schemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

// Usage: router.post('/', requireAuth, validate({ body: noteBodySchema }), createNote)
export const validate = (schemas: Schemas) => (req: Request, res: Response, next: NextFunction): void => {
  const details: { field: string; message: string }[] = [];

  for (const source of ['params', 'query', 'body'] as const) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(source === 'body' ? (req.body ?? {}) : req[source]);

    if (!result.success) {
      // Collect ALL problems so the client can fix them in one go
      for (const issue of result.error.issues) {
        details.push({ field: issue.path.join('.') || source, message: issue.message });
      }
      continue;
    }

    // Replace the raw input with the parsed one: unknown fields are stripped
    // and strings are trimmed / numbers coerced, so controllers get clean data.
    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'params') {
      req.params = result.data as typeof req.params;
    } else {
      // In Express 5 req.query is a read-only getter, so it must be redefined
      Object.defineProperty(req, 'query', { value: result.data, configurable: true, writable: true });
    }
  }

  if (details.length > 0) {
    // `error` is the human-readable summary the frontend shows (it displays data.error),
    // while `details` stays machine-readable for clients that want per-field messages.
    const summary = details.map((d) => d.message).join('; ');
    return next(new AppError(400, 'VALIDATION_ERROR', summary, details));
  }
  next();
};
