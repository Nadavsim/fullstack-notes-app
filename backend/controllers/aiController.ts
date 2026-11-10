import { Request, Response } from 'express';
import { runAgent } from '../services/aiService';

// The body is validated by aiCompleteSchema; Ollama failures are thrown by the
// service as AppError (502 / 504) and formatted by the error handler.
export const handleAiComplete = async (req: Request, res: Response): Promise<void> => {
  const result = await runAgent({ prompt: req.body.prompt });
  res.status(200).json(result);
};
