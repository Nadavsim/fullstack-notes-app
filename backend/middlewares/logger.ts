import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const route = req.originalUrl;
  
  // Format the body. If it's an empty object (like in GET requests), say 'None'
  const hasBody = req.body && Object.keys(req.body).length > 0;
  const bodyString = hasBody ? JSON.stringify(req.body) : 'None';

  // Construct the log line according to the assignment requirements
  const logEntry = `[${timestamp}] Method: ${method} | Route: ${route} | Body: ${bodyString}\n`;

  // Define the path for log.txt at the root of the backend folder
  const logFilePath = path.join(process.cwd(), 'log.txt');

  // Append the log entry to the file asynchronously (so it doesn't block the request)
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log.txt:', err);
    }
  });

  // VERY IMPORTANT: Pass control to the next middleware or router
  next();
};