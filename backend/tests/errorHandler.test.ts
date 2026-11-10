import { errorHandler } from '../middlewares/errorHandler';
import { AppError } from '../utils/AppError';

// Unit tests: call the handler directly with a fake response, no server or database needed.
const run = (err: any) => {
  const res: any = { headersSent: false, status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  errorHandler(err, {} as any, res, next);
  return { res, next, body: res.json.mock.calls[0]?.[0], status: res.status.mock.calls[0]?.[0] };
};

describe('errorHandler', () => {
  it('maps a MongoDB duplicate-key error (11000) to 409 with the field name', () => {
    const { status, body } = run({ code: 11000, keyPattern: { username: 1 }, keyValue: { username: 'bob' } });
    expect(status).toBe(409);
    expect(body).toEqual({ error: 'expected `username` to be unique', code: 'DUPLICATE_KEY' });
  });

  it('uses the status, code and details of an AppError', () => {
    const { status, body } = run(new AppError(404, 'NOT_FOUND', 'gone'));
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'gone', code: 'NOT_FOUND', details: undefined });
  });

  it('hides the message of an unexpected error behind a generic 500', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { status, body } = run(new Error('secret db password in message'));
    expect(status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    expect(spy).toHaveBeenCalled(); // the real error is still logged
    spy.mockRestore();
  });

  it('turns a Mongoose CastError into 400 INVALID_ID', () => {
    const { status, body } = run({ name: 'CastError', path: '_id' });
    expect(status).toBe(400);
    expect(body.code).toBe('INVALID_ID');
  });

  it('delegates to Express when the response was already started', () => {
    const res: any = { headersSent: true, status: jest.fn(), json: jest.fn() };
    const next = jest.fn();
    const err = new Error('late');
    errorHandler(err, {} as any, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });
});
