import { Router } from 'express';
import { createUser } from '../controllers/usersController';

const usersRouter = Router();

usersRouter.post('/', createUser);

export default usersRouter;