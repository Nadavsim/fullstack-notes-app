import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Every error response in the API has this one shape:
// { error: string, code: string, details?: [{ field, message }] }
// `error` stays a plain string so the existing frontend (`data.error`) keeps working.
interface ErrorBody {
  error: string;
  code: string;
  details?: { field: string; message: string }[];
}

// Runs for any request that matched no route.
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// The ONE place errors become responses. Must be registered last and keep 4 params.
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // Headers already sent -> let Express close the connection
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let body: ErrorBody = { error: 'Internal server error', code: 'INTERNAL_ERROR' };

  if (err instanceof AppError) {
    status = err.status;
    body = { error: err.message, code: err.code, details: err.details };
  } else if (err?.type === 'entity.parse.failed') {
    // express.json() received malformed JSON
    status = 400;
    body = { error: 'Malformed JSON body', code: 'INVALID_JSON' };
  } else if (err?.code === 11000) {
    // MongoDB unique-index violation. This is the real guard against duplicates: the
    // service's findOne check can be raced by two simultaneous requests, the index cannot.
    const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? 'value';
    status = 409;
    body = { error: `expected \`${field}\` to be unique`, code: 'DUPLICATE_KEY' };
  } else if (err?.name === 'CastError') {
    // Mongoose could not convert a value, e.g. a bad ObjectId in /notes/:id
    status = 400;
    body = { error: `Invalid value for '${err.path}'`, code: 'INVALID_ID' };
  } else {
    // Unexpected bug: log the details, but never leak them to the client
    console.error(err);
  }

  res.status(status).json(body);
};
