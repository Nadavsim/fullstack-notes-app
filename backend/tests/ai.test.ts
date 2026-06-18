import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../expressApp'; 
import Note from '../models/Note';
import User from '../models/User';

jest.setTimeout(30000);
const api = supertest(app);

describe('POST /ai/complete', () => {
    let token: string;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.TEST_MONGODB_CONNECTION_URL as string);
        }

    await User.deleteMany({ username: 'aitester' });
    await Note.deleteMany({ title: 'Top Secret DB' });

    // 1. Create user and log in to get a valid token
    await api.post('/users').send({
        name: 'AI Tester',
        email: 'ai@example.com',
        username: 'aitester',
        password: 'password123'
    });

    const loginRes = await api.post('/login').send({
        username: 'aitester',
        password: 'password123'
    });
    token = loginRes.body.token;

    // 2. Seed the target note with a distinctive keyword
    const testNote = new Note({
        title: 'Top Secret DB',
        content: 'Important note: my project uses cryptographic-handshake-v7 as the auth identifier.',
        author: { name: 'AI Tester', email: 'ai@example.com' }
    });
    await testNote.save();
  });

  // Give this specific test 30 seconds to finish communicating with Ollama
  test('returns 200 and generates text containing the database keyword', async () => {
    const prompt = 'Find a note that mentions cryptographic-handshake-v7 and tell me what identifier my project uses.';
    
    const response = await api
        .post('/ai/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt })
        .expect(200);

    expect(response.body.text).toBeDefined();
    // Proves the agent fetched the seeded note via tool-calling and used it
    expect(response.body.text).toContain('cryptographic-handshake-v7');
    }, 30000); 
});

afterAll(async () => {
    await mongoose.connection.close();
});