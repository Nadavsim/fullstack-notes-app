import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../expressApp'; // <-- Adjust if your app file is named differently
import Note from '../models/Note';
import User from '../models/User';

jest.setTimeout(30000);

const api = supertest(app);

describe('Backend Notes API (CRUD)', () => {
  let token: string;
  let savedNoteId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.TEST_MONGODB_CONNECTION_URL as string);
    }

    // 1. Clear the database
    await User.deleteMany({ username: 'crudtester' });
    await Note.deleteMany({ title: { $in: ['Initial Note', 'Test Note', 'Updated Title'] } });

    // 2. Create a test user
    await api.post('/users').send({
      name: 'CRUD Tester',
      email: 'crud@example.com',
      username: 'crudtester',
      password: 'password123'
    });

    // 3. Log in to get the token
    const loginRes = await api.post('/login').send({
      username: 'crudtester',
      password: 'password123'
    });
    token = loginRes.body.token;

    // 4. Seed an initial note for the PUT and DELETE tests
    const initialNote = await api
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Initial Note',
        content: 'This is the first note.'
      });
    
    savedNoteId = initialNote.body.id || initialNote.body._id;
  });

  test('POST /notes should create a new note and return 201 Created', async () => {
    const newNote = {
      title: 'Test Note',
      content: 'This is a test note.'
    };

    const response = await api
      .post('/notes')
      .set('Authorization', `Bearer ${token}`) // <-- Added Token!
      .send(newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    expect(response.body.title).toBe(newNote.title);
    expect(response.body.content).toBe(newNote.content);
  });

  test('PUT /notes/:id should update an existing note and return 200 OK', async () => {
    const updatedData = {
      title: 'Updated Title',
      content: 'Updated Content'
    };

    const response = await api
      .put(`/notes/${savedNoteId}`)
      .set('Authorization', `Bearer ${token}`) // <-- Added Token!
      .send(updatedData)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.content).toBe(updatedData.content);
  });

  test('DELETE /notes/:id should delete an existing note and return 204 No Content', async () => {
    await api
      .delete(`/notes/${savedNoteId}`)
      .set('Authorization', `Bearer ${token}`) // <-- Added Token!
      .expect(204);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});