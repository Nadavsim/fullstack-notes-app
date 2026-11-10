// backend/routes/aiRouter.ts
import { Router } from 'express';
import { handleAiComplete } from '../controllers/aiController';
import { requireAuth } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { aiCompleteSchema } from '../schemas/aiSchemas';

const aiRouter = Router();


// The frontend must send a token to use the AI.
aiRouter.post('/complete', requireAuth, validate({ body: aiCompleteSchema }), handleAiComplete);

export default aiRouter;