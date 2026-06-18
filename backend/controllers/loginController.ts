import { Request, Response } from 'express';
import { authenticateUser } from '../services/loginService';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        const authData = await authenticateUser(username, password);
        // 200 OK - Login successful
        res.status(200).json(authData);
    } 
    catch (error: any) {
        if (error.message === 'invalid username or password') {
        // 401 Unauthorized - Standard error for wrong credentials
            res.status(401).json({ error: error.message });
            return;
        }
    console.error("Login error:", error);
    res.status(500).json({ error: 'Something went wrong during login' });
    }
};