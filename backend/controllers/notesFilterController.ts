import { Request, Response } from 'express';
import { searchNotesByText } from '../services/notesFilterService';

// `query` is validated by filterQuerySchema before this runs
export const filterNotes = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query as { query: string };

  const matchedNotes = await searchNotesByText(query);

  res.setHeader('X-Total-Count', matchedNotes.length.toString());
  res.status(200).json(matchedNotes);
};
