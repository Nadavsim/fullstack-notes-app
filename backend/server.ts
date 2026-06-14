import app from './expressApp';
import connectDB from './config/db';

const PORT = process.env.PORT || 3001; // The backend usually runs on 3001 as per instructions

// Connect to MongoDB, then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    });
});