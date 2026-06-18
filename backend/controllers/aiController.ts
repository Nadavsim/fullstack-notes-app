// backend/controllers/aiController.ts
import { Request, Response } from 'express';
import { runAgent } from '../services/aiService';

export const handleAiComplete = async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required and must be a string' });
    return;
  }

  try {
    const result = await runAgent({ prompt });
    res.status(200).json(result);
  } catch (error: any) {
    console.error('AI Error:', error);
    
    // Check for the custom status codes we threw in the service
    if (error.status === 502) {
      res.status(502).json({ error: 'Bad Gateway - Ollama unreachable' });
    } else if (error.status === 504) {
      res.status(504).json({ error: 'Gateway Timeout - Agent looped too many times' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};