import { z } from 'zod';

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min === 1 ? `${label} must not be empty` : `${label} must be at least ${min} characters long`)
    .max(max, `${label} must be at most ${max} characters long`);

// POST /users (sign up)
export const createUserSchema = z.object({
  username: text('username', 3, 30),
  name: text('name', 1, 100),
  email: z.email({ error: 'email must be a valid email address' }).max(254, 'email is too long'),
  // max 72: bcrypt silently ignores bytes beyond 72, so longer passwords give a false sense of safety.
  // Not trimmed on purpose: spaces can be part of a password.
  password: z
    .string({ error: 'password is required' })
    .min(3, 'password must be at least 3 characters long')
    .max(72, 'password must be at most 72 characters long'),
});

// POST /login. Only checks that both fields are present. It deliberately does NOT
// enforce length rules, so the response never reveals the password policy.
export const loginSchema = z.object({
  username: z.string({ error: 'username is required' }).trim().min(1, 'username is required'),
  password: z.string({ error: 'password is required' }).min(1, 'password is required'),
});
