import Note, { INote } from '../models/Note';

// Fetch notes with pagination and sort by newest first
export const getNotesFromDB = async (skip: number, limit: number) => {
    const totalNotes = await Note.countDocuments();
    const notes = await Note.find()
    .sort({ _id: -1 }) // Requirement: newest first
    .skip(skip)
    .limit(limit);
    return { totalNotes, notes };
};

// Get a single note by ID
export const getNoteByIdFromDB = async (id: string) => {
    return await Note.findById(id);
};

// Create a new note
export const createNoteInDB = async (noteData: Partial<INote>) => {
const newNote = new Note(noteData);
    return await newNote.save();
};

// Update an existing note by ID
export const updateNoteInDB = async (id: string, noteData: Partial<INote>) => {
    return await Note.findByIdAndUpdate(id, noteData, { new: true });
};

// Delete a note by ID
export const deleteNoteFromDB = async (id: string) => {
    return await Note.findByIdAndDelete(id);
};

// Delete ALL notes (used only in development mode)
export const deleteAllNotesFromDB = async () => {
  // Passing an empty object {} means "match everything"
    return await Note.deleteMany({});
};

// --- INDEX-BASED OPERATIONS ---

// Find a single note by its index (0-based)
export const getNoteByIndexFromDB = async (index: number) => {
  // Sort by newest first, then skip 'index' items to get the right one
    return await Note.findOne().sort({ _id: -1 }).skip(index);
};

// Update a note by its index
export const updateNoteByIndexInDB = async (index: number, noteData: Partial<INote>) => {
    const noteToUpdate = await getNoteByIndexFromDB(index);
    if (!noteToUpdate) return null; // Note not found at this index
  // Now that we have the actual _id, we can update it
    return await Note.findByIdAndUpdate(noteToUpdate._id, noteData, { new: true });
};

// Delete a note by its index
export const deleteNoteByIndexFromDB = async (index: number) => {
    const noteToDelete = await getNoteByIndexFromDB(index);
    if (!noteToDelete) return null; // Note not found at this index
  // Now that we have the actual _id, we can delete it
    return await Note.findByIdAndDelete(noteToDelete._id);
};