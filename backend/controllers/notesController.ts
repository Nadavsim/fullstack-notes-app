import { Request, Response } from 'express';
import * as notesService from '../services/notesService'; 
import { AuthRequest } from '../middlewares/authMiddleware'; // Import the custom Request type
import User from '../models/User'; // Import the User model

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query._page as string) || 1;
  const requestedLimit = parseInt(req.query._per_page as string) || 10;
  const limit = Math.min(requestedLimit, 10);
  const skip = (page - 1) * limit;
  
  const { totalNotes, notes } = await notesService.getNotesFromDB(skip, limit);
  
  res.set('X-Total-Count', totalNotes.toString());
  res.status(200).json(notes);
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const note = await notesService.getNoteByIdFromDB(id);
  
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  res.status(200).json(note);
};

// --- PROTECTED ROUTES (Using AuthRequest) ---

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  // 1. Notice we DO NOT extract 'author' from req.body anymore
  const { title, content } = req.body;
  
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  try {
    // 2. Extract the decoded token data that the middleware attached
    const decodedToken = req.user as any;
    
    // 3. Fetch the real user from the database to ensure they still exist and get their details
    const user = await User.findById(decodedToken.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 4. Construct the secure note data package
    const secureNoteData = {
      title,
      content,
      author: {
        name: user.name,
        email: user.email
      },
      user: user._id // Link the Mongo ID
    };

    // 5. Pass the secure data to the service
    const savedNote = await notesService.createNoteInDB(secureNoteData);
    res.status(201).json(savedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  // For updates, we also ignore the frontend author field to prevent impersonation
  const { title, content } = req.body; 
  
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required for update' });
    return;
  }
  
  // Note: To be perfectly secure, the service should technically check if req.user.email matches the note's author.email before allowing the update.
  const updatedNote = await notesService.updateNoteInDB(id, { title, content });
  
  if (!updatedNote) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  
  res.status(200).json(updatedNote);
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  
  const deletedNote = await notesService.deleteNoteFromDB(id);
  
  if (!deletedNote) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  
  res.status(204).send();
};

export const deleteAllNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  await notesService.deleteAllNotesFromDB();
  res.status(204).send();
};

// --- INDEX-BASED CONTROLLERS ---

export const getNoteByIndex = async (req: Request, res: Response): Promise<void> => {
  const index = parseInt(req.params.i as string, 10);
  
  if (isNaN(index) || index < 0) {
    res.status(400).json({ error: 'Valid positive integer index is required' });
    return;
  }

  const note = await notesService.getNoteByIndexFromDB(index);
  
  if (!note) {
    res.status(404).json({ error: 'Note not found at this index' });
    return;
  }

  res.status(200).json(note);
};

export const updateNoteByIndex = async (req: AuthRequest, res: Response): Promise<void> => {
  const index = parseInt(req.params.i as string, 10);
  const { title, content } = req.body;

  if (isNaN(index) || index < 0) {
    res.status(400).json({ error: 'Valid positive integer index is required' });
    return;
  }

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required for update' });
    return;
  }

  const updatedNote = await notesService.updateNoteByIndexInDB(index, { title, content });
  
  if (!updatedNote) {
    res.status(404).json({ error: 'Note not found at this index' });
    return;
  }

  res.status(200).json(updatedNote);
};

export const deleteNoteByIndex = async (req: AuthRequest, res: Response): Promise<void> => {
  const index = parseInt(req.params.i as string, 10);
  
  if (isNaN(index) || index < 0) {
    res.status(400).json({ error: 'Valid positive integer index is required' });
    return;
  }

  const deletedNote = await notesService.deleteNoteByIndexFromDB(index);
  
  if (!deletedNote) {
    res.status(404).json({ error: 'Note not found at this index' });
    return;
  }

  res.status(204).send();
};