import 'dotenv/config';
import express, { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import cors from 'cors';
import notesRouter from './routes/notesRouter';
import testRouter from './routes/testRouter'; // Import the test router
import { requestLogger } from './middlewares/logger';
import usersRouter from './routes/usersRouter';
import loginRouter from './routes/loginRouter';
import aiRouter from './routes/aiRouter';

const app = express();

// --- Middlewares ---
app.use(cors({
  exposedHeaders: ['X-Total-Count'],
}));
app.use(express.json()); 
app.use(requestLogger);

// --- Health Check ---
// Recommended health check 
app.get('/health', (req: Request, res: Response) => {
  res.send('OK');
});

// --- Routes ---
app.use('/notes', notesRouter);
app.use('/ai', aiRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);

// Add the conditional dev route exactly as the assignment required
if (process.env.NODE_ENV === 'dev') {
  app.use('/test', testRouter);
}

// --- Error Handling (must stay last) ---
app.use(notFoundHandler); // unknown route -> 404 in the standard shape
app.use(errorHandler);    // the single place that formats every error

export default app;