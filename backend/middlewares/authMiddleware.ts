import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// We extend the standard Express Request to include our custom 'user' property
export interface AuthRequest extends Request {user?: string | jwt.JwtPayload;}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. Extract the 'Authorization' header from the incoming request
    const authorization = req.get('authorization');

    // 2. Check if it exists and follows the standard "Bearer <token>" format
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        const token = authorization.substring(7); // Remove "Bearer " to get just the token string
    
        try {
        // 3. Verify the token using our secret key
        if (!process.env.SECRET) {
            throw new Error('SECRET is missing');
        }
        const decodedToken = jwt.verify(token, process.env.SECRET);
        // 4. Attach the decoded user data (like their ID) to the request object
        req.user = decodedToken;
        // 5. Let the request pass through to the Controller
        next();
        } catch (error) {
        // Token is invalid or expired
        res.status(401).json({ error: 'token invalid' });
        }
    } else {
    // No token provided at all
    res.status(401).json({ error: 'token missing' });
    }
};