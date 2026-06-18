import Note from '../models/Note';

export const searchNotesBySubstring = async (query: string) => {
  // Use a case-insensitive regular expression for substring matching
  // Sort chronologically and limit to 10 as requested
  return await Note.find({ content: { $regex: query, $options: 'i' } })
    .sort({ createdAt: 1 }) 
    .limit(10);
};