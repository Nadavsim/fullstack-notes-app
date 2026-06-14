import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NoteProvider, NoteContext } from './contexts/NoteContext';
import { AddNote } from './components/AddNote';
import Pagination from './components/Pagination'; 
import Note from './components/Notes';
import './App.css';

const POSTS_PER_PAGE = 10;
const NOTES_URL = 'http://localhost:3001/notes';

// --- Logic: Custom Hook for Data Fetching ---
const useNotesData = (activePage: number) => {
  const context = useContext(NoteContext);
  const [totalPages, setTotalPages] = useState(1); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    
    setIsLoading(true);
    axios.get(NOTES_URL, { params: { _page: activePage, _per_page: POSTS_PER_PAGE } })
      .then((response) => {
        const data = response.data;
        const notesArray = Array.isArray(data) ? data : (data.data || []);
        
        context.dispatch({ type: 'SET_NOTES', payload: notesArray });
        
        if (data.pages && typeof data.pages === 'number') {
          setTotalPages(data.pages);
        } else {
          const totalCount = response.headers['x-total-count'];
          setTotalPages(totalCount ? Math.ceil(Number(totalCount) / POSTS_PER_PAGE) : 1);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Could not connect to the server. Please try again later.");
      })
      .finally(() => setIsLoading(false));
      
  }, [activePage, context?.dispatch]);

  return { context, isLoading, error, totalPages };
};

// --- UI: Main Component ---
const AppContent = () => {
  const [activePage, setActivePage] = useState(1);
  const { context, isLoading, error, totalPages } = useNotesData(activePage);

  if (!context) return null;
  const { state } = context;

  return (
    <div>
      <h1>Web Dev Fun Facts</h1>
      
      <div className="notification" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        {state.notification}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <AddNote />
      </div>

      <div className="notes-container">
        {isLoading && <p>Loading notes...</p>}
        
        {!isLoading && error && (
          <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>
            <h2>Oops!</h2>
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && state.notes.length === 0 && (
          <p style={{ textAlign: 'center' }}>No notes found for this page.</p>
        )}
        
        {!isLoading && !error && state.notes.length > 0 && (
          state.notes.map((note) => (
            <Note key={note._id} note={note} />
          ))
        )}
      </div>
      
      <Pagination 
        activePage={activePage} 
        totalPages={totalPages} 
        onPageChange={setActivePage} 
      />
    </div>
  );
};

export default function App() {
  return (
    <NoteProvider>
      <AppContent />
    </NoteProvider>
  );
}