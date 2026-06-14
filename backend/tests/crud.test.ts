import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path'; 
import app from '../expressApp';

// Tell dotenv EXACTLY where to find the .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Backend Notes API (CRUD)', () => {
  
  // Connect to the database before running any tests
  beforeAll(async () => {
    const url = process.env.MONGODB_CONNECTION_URL;
    if (url) {
      await mongoose.connect(url);
    } else {
      console.error("Missing MONGODB_CONNECTION_URL for tests. Check your .env file.");
    }
  });

  // Disconnect from the database after all tests are done
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /notes', () => {
    it('should return an array of notes and the X-Total-Count header', async () => {
      const response = await request(app).get('/notes?_page=1&_per_page=10');
      
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-total-count');
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

describe('POST /notes', () => {
    it('should create a new note and return 201 Created', async () => {
      // 1. Define the mock data to send
      const newNote = {
        title: 'My First TDD Note',
        author: {
          name: 'Jane Doe',
          email: 'jane@example.com'
        },
        content: 'This note was created during testing.'
      };

      // 2. Send the POST request
      const response = await request(app).post('/notes').send(newNote);
      
      // 3. Assertions based on assignment requirements
      expect(response.status).toBe(201); // 201 means "Created"
      expect(response.body).toHaveProperty('_id'); // MongoDB should auto-generate this
      expect(response.body.title).toBe(newNote.title);
      expect(response.body.content).toBe(newNote.content);
    });
  });  

describe('PUT /notes/:id', () => {
    it('should update an existing note and return 200 OK', async () => {
      // 1. Create a temporary note specifically for this test
      const tempNote = await request(app).post('/notes').send({
        title: 'Old Title',
        content: 'Old Content'
      });
      const noteId = tempNote.body._id;

      // 2. Send the PUT request with the updated data
      const updatedData = {
        title: 'New Updated Title',
        content: 'New Updated Content'
      };
      const response = await request(app).put(`/notes/${noteId}`).send(updatedData);
      
      // 3. Assertions based on assignment requirements
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.content).toBe(updatedData.content);
    });
  });

describe('DELETE /notes/:id', () => {
    it('should delete an existing note and return 204 No Content', async () => {
      // 1. Create a temporary note specifically for deletion
      const tempNote = await request(app).post('/notes').send({
        title: 'Note to be deleted',
        content: 'This will be gone soon'
      });
      const noteId = tempNote.body._id;

      // 2. Send the DELETE request
      const response = await request(app).delete(`/notes/${noteId}`);
      
      // 3. Assertions based on assignment requirements
      expect(response.status).toBe(204); // 204 means "No Content"
      
      // Note: A 204 response technically has no body, so we don't check response.body here
    });
  });
    
});