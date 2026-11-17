import Note from '../models/Note';

// Word search over title and content, served by the `notes_text` index (see models/Note.ts).
// - Matches whole words, with stemming, case-insensitive: "Flamingos" finds "flamingo".
//   It does NOT match parts of words: "flam" finds nothing (that was the old regex behaviour).
// - Several words are OR-ed; a phrase in "double quotes" must appear as written,
//   and a word starting with "-" excludes notes that contain it (MongoDB $search syntax).
// - Best matches first (relevance score), newest first among equal scores, max 10.
// The user's text is no longer turned into a regex, so it cannot trigger a slow regex.
export const searchNotesByText = async (query: string) => {
  return await Note.find({ $text: { $search: query } })
    .sort({ score: { $meta: 'textScore' }, _id: -1 })
    .limit(10);
};
