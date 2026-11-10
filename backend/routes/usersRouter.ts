import { Router } from 'express';
import { createUser } from '../controllers/usersController';
import { validate } from '../middlewares/validate';
import { createUserSchema } from '../schemas/usersSchemas';

const usersRouter = Router();

usersRouter.post('/', validate({ body: createUserSchema }), createUser);

export default usersRouter;