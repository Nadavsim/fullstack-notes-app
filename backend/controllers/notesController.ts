import { Request, Response } from 'express';
import { z } from 'zod';
import * as notesService from '../services/notesService';
import { AuthRequest } from '../middlewares/authMiddleware'; // Import the custom Request type
import User from '../models/User'; // Import the User model
import { AppError } from '../utils/AppError';
import { listQuerySchema } from '../schemas/notesSchemas';

// Input is already validated by the `validate` middleware (see routes/notesRouter.ts),
// and errors are thrown as AppError so the central error handler formats them.

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  // req.query was replaced by the parsed (coerced + defaulted) values
  const { _page: page, _per_page: requestedLimit } = req.query as unknown as z.infer<typeof listQuerySchema>;
  const limit = Math.min(requestedLimit, 10);
  const skip = (page - 1) * limit;

  const { totalNotes, notes } = await notesService.getNotesFromDB(skip, limit);

  res.set('X-Total-Count', totalNotes.toString());
  res.status(200).json(notes);
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  const note = await notesService.getNoteByIdFromDB(req.params.id as string);
  if (!note) throw AppError.notFound('Note not found');

  res.status(200).json(note);
};

// --- PROTECTED ROUTES (Using AuthRequest) ---

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  // The author is NEVER read from the body: it comes from the verified JWT
  const { title, content } = req.body;

  // Fetch the real user from the database to ensure they still exist and get their details
  const decodedToken = req.user as any;
  const user = await User.findById(decodedToken.id);
  if (!user) throw AppError.notFound('User not found');

  const secureNoteData = {
    title,
    content,
    author: { name: user.name, email: user.email },
    user: user._id, // Link the Mongo ID
  };
  const savedNote = await notesService.createNoteInDB(secureNoteData);
  res.status(201).json(savedNote);
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  // Note: To be perfectly secure, the service should also check that the caller owns the note.
  const { title, content } = req.body;
  const updatedNote = await notesService.updateNoteInDB(req.params.id as string, { title, content });
  if (!updatedNote) throw AppError.notFound('Note not found');

  res.status(200).json(updatedNote);
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const deletedNote = await notesService.deleteNoteFromDB(req.params.id as string);
  if (!deletedNote) throw AppError.notFound('Note not found');

  res.status(204).send();
};

export const deleteAllNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  await notesService.deleteAllNotesFromDB();
  res.status(204).send();
};

// --- INDEX-BASED CONTROLLERS ---
// `:i` is validated as an integer >= 0 by indexParamSchema, so Number() is safe here.

export const getNoteByIndex = async (req: Request, res: Response): Promise<void> => {
  const note = await notesService.getNoteByIndexFromDB(Number(req.params.i));
  if (!note) throw AppError.notFound('Note not found at this index');

  res.status(200).json(note);
};

export const updateNoteByIndex = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content } = req.body;
  const updatedNote = await notesService.updateNoteByIndexInDB(Number(req.params.i), { title, content });
  if (!updatedNote) throw AppError.notFound('Note not found at this index');

  res.status(200).json(updatedNote);
};

export const deleteNoteByIndex = async (req: AuthRequest, res: Response): Promise<void> => {
  const deletedNote = await notesService.deleteNoteByIndexFromDB(Number(req.params.i));
  if (!deletedNote) throw AppError.notFound('Note not found at this index');

  res.status(204).send();
};
