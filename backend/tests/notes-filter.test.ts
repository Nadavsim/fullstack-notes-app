import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../expressApp'; 
import Note from '../models/Note';

jest.setTimeout(30000);
const api = supertest(app);

describe('GET /notes/filter', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.TEST_MONGODB_CONNECTION_URL as string);
    }
    await Note.deleteMany({ title: 'Filter Test Note' });
    
    // Seed a note with a highly distinctive keyword
    const testNote = new Note({
      title: 'Filter Test Note',
      content: 'This note contains the distinctive keyword FLAMINGO for testing.',
      author: { name: 'Test', email: 'test@example.com' }
    });
    await testNote.save();
  });

  test('returns 200 and an array containing the note when query matches', async () => {
    const response = await api
      .get('/notes/filter?query=FLAMINGO')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].content).toContain('FLAMINGO');
  });

  test('returns 400 when the query parameter is missing', async () => {
    await api
      .get('/notes/filter')
      .expect(400);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});