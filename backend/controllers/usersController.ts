import { Request, Response } from 'express';
import { createNewUser } from '../services/userService';

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, name, email, password } = req.body;

    // 1. Basic validation (Controller's job: check if the request is malformed)
    if (!password || password.length < 3) {
        res.status(400).json({ error: 'password must be at least 3 characters long' });
        return;
    }

    // 2. Pass the clean data to the Service
    const savedUser = await createNewUser(username, name, email, password);

    // 3. Respond with success
    res.status(201).json(savedUser);
    
  } catch (error: any) {
    // 4. Handle specific errors thrown by the Service
    if (error.message === 'expected `username` to be unique') {
        res.status(400).json({ error: error.message });
        return;
    }
    
    console.error("Error creating user:", error);
    res.status(500).json({ error: 'Something went wrong while creating the user' });
    }
};