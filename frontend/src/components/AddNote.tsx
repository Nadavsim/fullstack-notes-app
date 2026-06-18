import { useState, useContext } from 'react';
import { NoteContext } from '../contexts/NoteContext';
import axios from 'axios';
import '../Portfolio.css';

export const AddNote = () => {
  const context = useContext(NoteContext);
  if (!context) return null;
  const { dispatch } = context;

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  // AI Assistant State ---
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return; 
    }
    try {
      const res = await axios.post('http://localhost:3001/notes', {
        title: 'New Note',
        author: { name: 'User', email: 'user@example.com' },
        content: content
      });
      
      dispatch({ type: 'ADD_NOTE', payload: res.data });
      dispatch({ type: 'SET_NOTIFICATION', payload: 'Added a new note' });
      
      // Reset everything after save
      setIsEditing(false);
      setContent('');
      setShowAiInput(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // --- NEW: AI Submit Handler ---
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/ai/complete', { 
        prompt: aiPrompt 
      });
      
      // Append the AI text to the existing content
      setContent(prevContent => {
        const separator = prevContent.trim() !== '' ? ' ' : '';
        return prevContent + separator + response.data.text;
      });
      
      // Close the AI input box after generation
      setShowAiInput(false);
      setAiPrompt('');
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Failed to generate AI text. Check your backend connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="note-editor-card">
        <div className="note-input-row">
          <input 
            type="text" 
            value={content} 
            name="text_input_new_note" 
            onChange={(e) => setContent(e.target.value)} 
            className="premium-input"
            placeholder="What's on your mind?"
          />
          
          <button 
            type="button"
            data-testid="help_me_write"
            onClick={() => setShowAiInput(!showAiInput)}
            className="ai-trigger-btn"
            title="Notes-based AI assistant"
          >
            ★
          </button>
        </div>

        {showAiInput && (
          <div className="ai-prompt-panel large">
            <input
              type="text"
              data-testid="help_me_write_prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask the AI to summarize or find notes..."
              disabled={isAiLoading}
              className="ai-large-input"
            />
            <button 
              type="button" 
              data-testid="help_me_write_submit"
              onClick={handleAiSubmit}
              disabled={isAiLoading}
              className="btn-primary ai-submit-btn"
            >
              {isAiLoading ? 'Generating...' : '✨ Generate'}
            </button>
          </div>
        )}

        <div className="button-group">
          <button name="text_input_save_new_note" onClick={handleSave} className="btn-primary" style={{ marginTop: 0 }}>
            Save
          </button>
          <button name="text_input_cancel_new_note" onClick={() => {
            setIsEditing(false);
            setShowAiInput(false);
            setAiPrompt('');
          }} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button name="add_new_note" onClick={() => setIsEditing(true)}>
      Add new note
    </button>
  );
};