import { Request, Response } from 'express';
import { searchNotesBySubstring } from '../services/notesFilterService';

export const filterNotes = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  // 1. Validate the query parameter
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required and must be a string' });
    return;
  }

  try {
    // 2. Fetch the notes
    const matchedNotes = await searchNotesBySubstring(query);

    // 3. Set the required header and return the array
    res.setHeader('X-Total-Count', matchedNotes.length.toString());
    res.status(200).json(matchedNotes);
  } catch (error) {
    console.error('Error filtering notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};