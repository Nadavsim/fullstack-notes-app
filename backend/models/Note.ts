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
    name: { type: String },
    email: { type: String }
    },
    content: { type: String, required: true }
});

// Create and export the model
const Note = mongoose.model<INote>('Note', noteSchema);
export default Note;