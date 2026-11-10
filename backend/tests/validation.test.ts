import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../expressApp';

// None of these tests touch the database: every request is rejected
// (by auth, validation or the 404 handler) before any DB call happens.
const api = supertest(app);

// A valid-looking 24-char id, and a signed token so we can get past requireAuth
const validId = '507f1f77bcf86cd799439011';
const token = jwt.sign({ id: validId, username: 'tester' }, process.env.SECRET || 'test-secret');

// If SECRET is unset the middleware can't verify; make sure tests don't depend on a real .env
beforeAll(() => {
  process.env.SECRET = process.env.SECRET || 'test-secret';
});

describe('Error response shape', () => {
  it('returns { error, code } for an unknown route (404)', async () => {
    const res = await api.get('/does-not-exist').expect(404);
    expect(res.body).toEqual({ error: 'Route GET /does-not-exist not found', code: 'NOT_FOUND' });
  });

  it('returns 400 INVALID_JSON for a malformed JSON body', async () => {
    const res = await api.post('/login').set('Content-Type', 'application/json').send('{bad').expect(400);
    expect(res.body).toEqual({ error: 'Malformed JSON body', code: 'INVALID_JSON' });
  });

  it('returns 401 with a code when the token is missing', async () => {
    const res = await api.post('/notes').send({ title: 't', content: 'c' }).expect(401);
    expect(res.body).toEqual({ error: 'token missing', code: 'UNAUTHORIZED' });
  });

  it('returns 401 with a code when the token is invalid', async () => {
    const res = await api.post('/notes').set('Authorization', 'Bearer nope').send({}).expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /notes validation', () => {
  const post = (body?: object) => api.post('/notes').set('Authorization', `Bearer ${token}`).send(body);

  it('reports every invalid field with a readable summary', async () => {
    const res = await post({ title: '   ', content: 5 }).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details.map((d: any) => d.field).sort()).toEqual(['content', 'title']);
    // `error` is the joined messages, so the frontend (which shows data.error) stays useful
    expect(res.body.error).toContain('Title must not be empty');
  });

  it('treats a missing body like an empty one', async () => {
    const res = await post().expect(400);
    expect(res.body.error).toContain('Title is required');
    expect(res.body.error).toContain('Content is required');
  });

  it('rejects a title over 200 characters', async () => {
    const res = await post({ title: 'x'.repeat(201), content: 'ok' }).expect(400);
    expect(res.body.details[0]).toEqual({ field: 'title', message: 'Title must be at most 200 characters' });
  });
});

describe('Param and query validation', () => {
  it('rejects a malformed note id with 400 instead of a 500', async () => {
    const res = await api.get('/notes/not-an-id').expect(400);
    expect(res.body.details).toEqual([{ field: 'id', message: 'id must be a valid 24-character id' }]);
  });

  it('rejects a negative or non-numeric index', async () => {
    await api.get('/notes/by-index/-1').expect(400);
    await api.get('/notes/by-index/abc').expect(400);
  });

  it('rejects _page=0 instead of silently using page 1', async () => {
    const res = await api.get('/notes?_page=0').expect(400);
    expect(res.body.details[0].field).toBe('_page');
  });

  it('requires the filter query', async () => {
    const res = await api.get('/notes/filter').expect(400);
    expect(res.body.details[0].field).toBe('query');
  });
});

describe('Users and login validation', () => {
  it('lists all sign-up problems at once', async () => {
    const res = await api.post('/users').send({ username: 'a', name: '', email: 'nope', password: 'x' }).expect(400);
    expect(res.body.details.map((d: any) => d.field).sort()).toEqual(['email', 'name', 'password', 'username']);
  });

  it('keeps the readable password message in `error`', async () => {
    const res = await api
      .post('/users')
      .send({ username: 'validname', name: 'N', email: 'a@b.co', password: 'x' })
      .expect(400);
    expect(res.body.error).toBe('password must be at least 3 characters long');
  });

  it('requires both login fields without leaking password rules', async () => {
    const res = await api.post('/login').send({}).expect(400);
    expect(res.body.details).toEqual([
      { field: 'username', message: 'username is required' },
      { field: 'password', message: 'password is required' },
    ]);
  });
});

describe('AI validation', () => {
  it('requires auth first, then a non-empty prompt', async () => {
    await api.post('/ai/complete').send({}).expect(401);
    const res = await api.post('/ai/complete').set('Authorization', `Bearer ${token}`).send({ prompt: '  ' }).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
