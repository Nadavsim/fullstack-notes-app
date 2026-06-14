import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import notesRouter from './routes/notesRouter';
import testRouter from './routes/testRouter'; // Import the test router
import { requestLogger } from './middlewares/logger';

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

// Add the conditional dev route exactly as the assignment required
if (process.env.NODE_ENV === 'dev') {
  app.use('/test', testRouter);
}

// --- Error Handling ---
// Single error handling middleware 
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message); // Log to terminal for easier debugging
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;