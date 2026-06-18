import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';

export const authenticateUser = async (username: string, password: string) => {
    // 1. Find the user in the database
    const user = await User.findOne({ username });

    // 2. Check if the user exists and if the password matches (secure hash comparison)
    const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.passwordHash);

    if (!(user && passwordCorrect)) {
        throw new Error('invalid username or password');
    }

    // 3. Prepare the payload to be saved inside the Token
    const userForToken = {username: user.username,id: user._id,};

    // 4. Sign the Token (must ensure SECRET exists in .env)
    if (!process.env.SECRET) {
        throw new Error('SECRET environment variable is missing');
    }

    // Security bonus: Token expires in 1 hour
    const token = jwt.sign(userForToken, process.env.SECRET,{ expiresIn: 60 * 60 });

    // 5. Return the Token along with user details the Frontend will need
    return {token,username: user.username,name: user.name,email: user.email};
};