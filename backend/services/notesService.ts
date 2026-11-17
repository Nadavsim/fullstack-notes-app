import { SortOrder } from 'mongoose';
import Note, { INote, TITLE_COLLATION } from '../models/Note';
import { ListQuery } from '../schemas/notesSchemas';

export interface NotesSort {
    field: ListQuery['_sort'];
    order: ListQuery['_order'];
}

// Turn the public sort options into a MongoDB sort object.
// - "createdAt" is served by _id: an ObjectId starts with its creation time, so sorting
//   by _id is sorting by creation date, using the index every collection already has.
// - _id is always the last key, a unique tie-breaker. Without it, notes with the same
//   title have no fixed order and could appear on two pages, or on none.
export const buildSort = ({ field, order }: NotesSort): Record<string, SortOrder> => {
    const dir: SortOrder = order === 'asc' ? 1 : -1;
    if (field === 'title') return { title: dir, _id: dir };
    return { _id: dir };
};

// Fetch one page of notes in the requested order (default: newest first)
export const getNotesFromDB = async (skip: number, limit: number, sort: NotesSort = { field: 'createdAt', order: 'desc' }) => {
    const totalNotes = await Note.countDocuments();
    const query = Note.find().sort(buildSort(sort)).skip(skip).limit(limit);
    // The title sort must use the same collation as the title_sort index, or MongoDB
    // ignores the index and falls back to an in-memory sort.
    if (sort.field === 'title') query.collation(TITLE_COLLATION);
    const notes = await query;
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