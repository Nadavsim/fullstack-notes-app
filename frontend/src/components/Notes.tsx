import { useState, useContext } from 'react';
import type { Note as NoteType } from '../types';
import { NoteContext } from '../contexts/NoteContext';
import axios from 'axios';
import { sanitizeHtml } from '../sanitizer';

interface NoteProps {
  note: NoteType;
  sanitizerEnabled: boolean;
  currentUser?: { 
    name: string;
    email: string;
    username: string;
  } | null;
}

// 1. Destructure currentUser here
const Note = ({ note, currentUser, sanitizerEnabled }: NoteProps) => {
  const context = useContext(NoteContext);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  if (!context) return null;
  const { dispatch } = context;

  // 2. The Ownership Check: true ONLY if logged in and emails match
  const isOwner = currentUser && note.author && currentUser.email === note.author.email;

  // --- Action Handlers ---
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/notes/${note.id}`);
      dispatch({ type: 'DELETE_NOTE', payload: note.id });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Note deleted' });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleUpdate = async () => {
    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return; 
    }

    try {
      const res = await axios.put(`http://localhost:3001/notes/${note.id}`, { ...note, content });
      dispatch({ type: 'UPDATE_NOTE', payload: res.data });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Note updated' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent(note.content); 
  };

  // --- Sub-renders ---
  const renderEditControls = () => (
    <>
      <textarea 
        data-testid={`text_input-${note.id}`} 
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button data-testid={`text_input_save-${note.id}`} onClick={handleUpdate}>
        Save
      </button>
      <button data-testid={`text_input_cancel-${note.id}`} onClick={handleCancelEdit}>
        Cancel
      </button>
    </>
  );


  const displayHtml = sanitizerEnabled ? sanitizeHtml(note.content) : note.content;

  // --- Main Render ---
  return (
    <div className="note" data-testid={note.id}>
      <h2>{note.title}</h2>
      {/* Fallback to 'Guest' if author is null */}
      <small>By {note.author?.name || 'Guest'}</small>
      <div data-testid="note_body" dangerouslySetInnerHTML={{ __html: displayHtml }} />

      {/* 3. Wrap the action buttons so they only render for the owner */}
      {isOwner && (
        <div className="note-actions">
          <button data-testid={`delete-${note.id}`} onClick={handleDelete}>
            Delete
          </button>

          {isEditing ? (
            renderEditControls()
          ) : (
            <button data-testid={`edit-${note.id}`} onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Note;