import { Request, Response } from 'express';
import { createNewUser } from '../services/userService';

// The body is validated by createUserSchema; errors (e.g. duplicate username)
// are thrown by the service as AppError and formatted by the error handler.
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { username, name, email, password } = req.body;
  const savedUser = await createNewUser(username, name, email, password);
  res.status(201).json(savedUser);
};
