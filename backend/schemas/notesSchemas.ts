import { z } from 'zod';

// A reusable "required, trimmed, non-empty, max length" string with readable messages
const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`)
    .max(max, `${label} must be at most ${max} characters`);

// POST /notes and PUT /notes/:id (and by-index). Extra fields such as `author` are
// stripped on purpose: the author always comes from the JWT, never from the client.
export const noteBodySchema = z.object({
  title: requiredText('Title', 200),
  content: requiredText('Content', 10000),
});

// :id must look like a MongoDB ObjectId (24 hex characters)
export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'id must be a valid 24-character id'),
});

// :i is a zero-based position in the newest-first list
export const indexParamSchema = z.object({
  i: z.coerce.number({ error: 'index must be a number' }).int('index must be an integer').min(0, 'index must be 0 or greater'),
});

// GET /notes?_page=2&_per_page=10  (both optional, defaults match the old behaviour)
export const listQuerySchema = z.object({
  _page: z.coerce.number().int().min(1, '_page must be 1 or greater').default(1),
  _per_page: z.coerce.number().int().min(1, '_per_page must be 1 or greater').default(10),
});

// GET /notes/filter?query=text
export const filterQuerySchema = z.object({
  query: z
    .string({ error: 'query is required and must be a string' })
    .trim()
    .min(1, 'query must not be empty')
    .max(200, 'query must be at most 200 characters'),
});
