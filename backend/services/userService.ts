import bcrypt from 'bcrypt';
import User from '../models/User';

export const createNewUser = async (username: string, name: string, email: string, password: string) => {
    // 1. Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('expected `username` to be unique');
    }

    // 2. Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Create the user object
    const user = new User({
        username,
        name,
        email,
        passwordHash
    });

    // 4. Save to MongoDB and return the result
    return await user.save();
};