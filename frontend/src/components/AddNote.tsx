import { useState, useContext } from 'react';
import { NoteContext } from '../contexts/NoteContext';
import axios from 'axios';

export const AddNote = () => {
  const context = useContext(NoteContext);
  if (!context) return null;
  const { dispatch } = context;

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  const handleSave = async () => {
    // Edge Case: Prevent saving empty notes
    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return; // Stop execution here
    }
    try {
      // Send data to our local backend
      const res = await axios.post('http://localhost:3001/notes', {
        title: 'New Note',
        author: { name: 'User', email: 'user@example.com' },
        content: content
      });
      
      // Update global state
      dispatch({ type: 'ADD_NOTE', payload: res.data });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Added a new note' });
      
      // Reset local state
      setIsEditing(false);
      setContent('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // The Exact HTML structure required by the assignment when clicked
  if (isEditing) {
    return (
      <div>
        <input 
          type="text" 
          value={content} 
          name="text_input_new_note" 
          onChange={(e) => setContent(e.target.value)} 
        />
        <button name="text_input_save_new_note" onClick={handleSave}>Save</button>
        <button name="text_input_cancel_new_note" onClick={() => setIsEditing(false)}>Cancel</button>
      </div>
    );
  }

  // The Exact HTML structure before clicking
  return (
    <button name="add_new_note" onClick={() => setIsEditing(true)}>
      Add new note
    </button>
  );
};