import mongoose, { Schema, Document } from 'mongoose';

// Interface defining the TypeScript structure
export interface INote extends Document {
  title: string;
  author: {
    name: string;
    email: string;
  } | null;
  content: string;
}

// Mongoose Schema defining the database structure
const noteSchema: Schema = new Schema({
    title: { type: String, required: true },
    author: {
      type: {
        name: { type: String },
        email: { type: String }
      },
      default: null
      },
    content: { type: String, required: true },
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
});

// How titles are compared when sorting:
// - strength 2: ignore upper/lower case, so "apple" sorts next to "Apple", not after "Zebra"
// - numericOrdering: compare digits as numbers, so "Note 9" comes before "Note 10"
export const TITLE_COLLATION = { locale: 'en', strength: 2, numericOrdering: true };

// Index for GET /notes?_sort=title. It matches the sort { title, _id } exactly, so MongoDB
// can read notes in order from the index instead of sorting them in memory. The same index
// also serves descending order, because an index can be walked backwards.
// A query only uses this index for string ordering if it asks for the SAME collation.
noteSchema.index({ title: 1, _id: 1 }, { name: 'title_sort', collation: TITLE_COLLATION });

// Text index for GET /notes/filter (and the AI's filter_notes tool).
// It splits title and content into words, stems them ("flamingos" -> "flamingo") and drops
// English stop words, so $text searches use the index instead of scanning every note.
// A title match counts 5x a content match when ranking. A collection can have only ONE text index.
noteSchema.index(
  { title: 'text', content: 'text' },
  { name: 'notes_text', weights: { title: 5, content: 1 }, default_language: 'english' }
);

noteSchema.set('toJSON', {
  transform: (document, returnedObject: any) => {
    // Keep your existing transformation logic here
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

// Create and export the model
const Note = mongoose.model<INote>('Note', noteSchema);
export default Note;