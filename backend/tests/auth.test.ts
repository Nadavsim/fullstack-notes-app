import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../expressApp'; 
import User from '../models/User';

jest.setTimeout(30000);
const api = supertest(app);

describe('Authentication & User Creation', () => {
    beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.TEST_MONGODB_CONNECTION_URL as string);
    }
  });
  
  beforeEach(async () => {
    await User.deleteMany({ username: { $in: ['testadmin', 'logintester'] } });
  });

  test('POST /users creates a new user and returns 201', async () => {
    const newUser = {
      name: 'Test Admin',
      email: 'admin@example.com',
      username: 'testadmin',
      password: 'password123'
    };

    await api
      .post('/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await User.find({ username: 'testadmin' });
    expect(usersAtEnd).toHaveLength(1);
    expect(usersAtEnd[0].username).toBe('testadmin');
  });

  test('POST /login returns 200 and a signed token for valid credentials', async () => {
    // 1. Create the user first
    await api.post('/users').send({
      name: 'Login Tester',
      email: 'login@example.com',
      username: 'logintester',
      password: 'password123'
    });

    // 2. Attempt to login
    const response = await api
      .post('/login')
      .send({
        username: 'logintester',
        password: 'password123'
      })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});