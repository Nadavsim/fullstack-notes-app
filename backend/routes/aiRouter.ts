// backend/routes/aiRouter.ts
import { Router } from 'express';
import { handleAiComplete } from '../controllers/aiController';
import { requireAuth } from '../middlewares/authMiddleware';

const aiRouter = Router();


// The frontend must send a token to use the AI.
aiRouter.post('/complete', requireAuth, handleAiComplete);

export default aiRouter;