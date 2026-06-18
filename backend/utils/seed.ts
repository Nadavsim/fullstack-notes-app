import mongoose from 'mongoose';
import Note from '../models/Note';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_URL as string);
    console.log('Connected to MongoDB');

    // Find the test user you created earlier to assign as the author
    const user = await User.findOne({ username: 'testuser1' }); // Replace with your actual test username
    if (!user) {
      console.log('Please create a test user in the app first!');
      process.exit(1);
    }

    const dummyNotes = [];
    for (let i = 1; i <= 50; i++) {
      dummyNotes.push({
        title: `Seeded Note ${i}`,
        content: `This is the auto-generated content for note number ${i}. It helps test pagination and AI filtering!`,
        author: {
          name: user.name,
          email: user.email,
        },
        user: user._id
      });
    }

    await Note.insertMany(dummyNotes);
    console.log('Successfully added 50 notes!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
  }
};

seedDatabase();