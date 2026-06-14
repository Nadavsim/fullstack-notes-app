import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load variables from .env file
dotenv.config();

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_CONNECTION_URL;
        if (!mongoUrl) {
        throw new Error('MONGODB_CONNECTION_URL is missing in .env file');
    }

    await mongoose.connect(mongoUrl);
    console.log('MongoDB Atlas Connected Successfully');
    } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1); // Stop the app if the database connection fails
    }
};

export default connectDB;