import { useState, useContext } from 'react';
import type { Note as NoteType } from '../types';
import { NoteContext } from '../contexts/NoteContext';
import axios from 'axios';

interface NoteProps {
  note: NoteType;
}

const Note = ({ note }: NoteProps) => {
  const context = useContext(NoteContext);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  if (!context) return null;
  const { dispatch } = context;

  // --- Action Handlers ---
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/notes/${note._id}`);
      dispatch({ type: 'DELETE_NOTE', payload: note._id });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Note deleted' });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleUpdate = async () => {
    // Edge Case: Prevent updating a note to be empty
    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return; // Stop execution here
    }

    try {
      const res = await axios.put(`http://localhost:3001/notes/${note._id}`, { ...note, content });
      dispatch({ type: 'UPDATE_NOTE', payload: res.data });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Note updated' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent(note.content); // Revert changes if cancelled
  };

  // --- Sub-renders ---
  const renderEditControls = () => (
    <>
      <textarea 
        data-testid={`text_input-${note._id}`} 
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button data-testid={`text_input_save-${note._id}`} onClick={handleUpdate}>
        Save
      </button>
      <button data-testid={`text_input_cancel-${note._id}`} onClick={handleCancelEdit}>
        Cancel
      </button>
    </>
  );

  // --- Main Render ---
  return (
    <div className="note" data-testid={note._id}>
      <h2>{note.title}</h2>
      <small>By {note.author?.name}</small>
      {note.content}
      <button data-testid={`delete-${note._id}`} onClick={handleDelete}>
        Delete
      </button>

      {isEditing ? (
        renderEditControls()
      ) : (
        <button data-testid={`edit-${note._id}`} onClick={() => setIsEditing(true)}>
          Edit
        </button>
      )}
    </div>
  );
};

export default Note;