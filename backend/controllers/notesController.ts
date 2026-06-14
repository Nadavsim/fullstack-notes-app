import { Request, Response } from 'express';
import * as notesService from '../services/notesService'; 

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query._page as string) || 1;
  const requestedLimit = parseInt(req.query._per_page as string) || 10;
  const limit = Math.min(requestedLimit, 10);
  const skip = (page - 1) * limit;
  
  // Call the service instead of querying the DB directly
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

export const createNote = async (req: Request, res: Response): Promise<void> => {
  const { title, author, content } = req.body;
  
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }
  
  // Pass data to the service
  const savedNote = await notesService.createNoteInDB({ title, author, content });
  res.status(201).json(savedNote);
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { title, author, content } = req.body;
  
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required for update' });
    return;
  }
  
  // Call the service
  const updatedNote = await notesService.updateNoteInDB(id, { title, author, content });
  
  if (!updatedNote) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  
  res.status(200).json(updatedNote);
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  
  // Call the service
  const deletedNote = await notesService.deleteNoteFromDB(id);
  
  if (!deletedNote) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  
  res.status(204).send();
};

export const deleteAllNotes = async (req: Request, res: Response): Promise<void> => {
  await notesService.deleteAllNotesFromDB();
  // 204 No Content is the standard response for a successful deletion
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

export const updateNoteByIndex = async (req: Request, res: Response): Promise<void> => {
  const index = parseInt(req.params.i as string, 10);
  const { title, author, content } = req.body;

  if (isNaN(index) || index < 0) {
    res.status(400).json({ error: 'Valid positive integer index is required' });
    return;
  }

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required for update' });
    return;
  }

  const updatedNote = await notesService.updateNoteByIndexInDB(index, { title, author, content });
  
  if (!updatedNote) {
    res.status(404).json({ error: 'Note not found at this index' });
    return;
  }

  res.status(200).json(updatedNote);
};

export const deleteNoteByIndex = async (req: Request, res: Response): Promise<void> => {
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