import { Router } from 'express';
import { login } from '../controllers/loginController';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../schemas/usersSchemas';

const loginRouter = Router();

loginRouter.post('/', validate({ body: loginSchema }), login);

export default loginRouter;