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