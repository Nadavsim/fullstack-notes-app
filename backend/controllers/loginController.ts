import { Request, Response } from 'express';
import { authenticateUser } from '../services/loginService';

// The body is validated by loginSchema; a wrong password is thrown as an AppError (401)
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const authData = await authenticateUser(username, password);
  res.status(200).json(authData);
};
