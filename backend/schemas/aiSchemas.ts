import { z } from 'zod';

// POST /ai/complete
export const aiCompleteSchema = z.object({
  prompt: z
    .string({ error: 'prompt is required and must be a string' })
    .trim()
    .min(1, 'prompt must not be empty')
    .max(2000, 'prompt must be at most 2000 characters'),
});
