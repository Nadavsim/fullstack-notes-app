import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// Ensure the path to the model matches your file structure
import Note from '../models/Note'; 

// Load environment variables from the backend's .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
    try {
        // Get the filename from the command line arguments (default: data1.json)
        const fileName = process.argv[2] || 'data1.json';
        
        // Create the full path to the data directory located outside the backend folder
        const filePath = path.join(__dirname, '../../data', fileName); 

        // Check if the file actually exists
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found at ${filePath}`);
            process.exit(1);
        }

        // Read the file and parse it to JSON
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const parsedData = JSON.parse(rawData);
        
        // Support both possible formats (direct array or an object with a 'notes' key)
        const notesToInsert = parsedData.notes ? parsedData.notes : parsedData;

        // Connect to the database
        await mongoose.connect(process.env.MONGODB_CONNECTION_URL as string);
        console.log('Connected to MongoDB.');

        // Delete all existing notes
        await Note.deleteMany({});
        console.log('Cleared existing notes.');

        // Insert the new notes
        await Note.insertMany(notesToInsert);
        console.log(`✅ Successfully seeded database with ${fileName}!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();