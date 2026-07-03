import { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { NoteProvider, NoteContext } from './contexts/NoteContext';
import { AddNote } from './components/AddNote';
import Pagination from './components/Pagination'; 
import Note from './components/Notes';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import './App.css';

const POSTS_PER_PAGE = 10;
const NOTES_URL = 'http://localhost:3001/notes';



// --- Logic: Custom Hook for Data Fetching & Caching ---
const useNotesData = (activePage: number) => {
  const context = useContext(NoteContext);
  const [totalPages, setTotalPages] = useState(1); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The Cache: stores pages like a dictionary { 1: [notes], 2: [notes] }
  const [cache, setCache] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!context) return;
    
    const fetchWithCache = async () => {
      // 1. INSTANT RENDER: If cached, show immediately
      if (cache[activePage]) {
        context.dispatch({ type: 'SET_NOTES', payload: cache[activePage] });
        setIsLoading(false); 
      } else {
        setIsLoading(true); 
      }

      try {
        // 2. CALCULATE VISIBLE PAGINATION BAR PAGES
        // Optimistically assume 5 pages initially. Once totalPages updates, math is exact.
        let startPage = 1;
        let endPage = 5;

        if (totalPages > 1) {
          if (totalPages <= 5) {
            startPage = 1;
            endPage = totalPages;
          } else if (activePage <= 3) {
            startPage = 1;
            endPage = 5;
          } else if (activePage >= totalPages - 2) {
            startPage = totalPages - 4;
            endPage = totalPages;
          } else {
            startPage = activePage - 2;
            endPage = activePage + 2;
          }
        }

        // 3. FIGURE OUT WHAT TO FETCH
        const pagesToFetch: number[] = [];
        for (let i = startPage; i <= endPage; i++) {
          if (!cache[i]) {
            pagesToFetch.push(i);
          }
        }

        // 4. FETCH IN PARALLEL (Minimal Fetching)
        if (pagesToFetch.length > 0) {
          const fetchPromises = pagesToFetch.map(page => 
            axios.get(NOTES_URL, { params: { _page: page, _per_page: POSTS_PER_PAGE } })
          );

          const responses = await Promise.all(fetchPromises);
          
          // 5. UPDATE THE CACHE
          const newCacheData = { ...cache };
          let newTotalPages = totalPages;

          responses.forEach((response, index) => {
            const pageNum = pagesToFetch[index];
            const data = response.data;
            const notesArray = Array.isArray(data) ? data : (data.data || []);
            
            newCacheData[pageNum] = notesArray; 

            if (index === 0) {
              if (data.pages && typeof data.pages === 'number') {
                newTotalPages = data.pages;
              } else {
                const totalCount = response.headers['x-total-count'];
                if (totalCount) {
                  newTotalPages = Math.ceil(Number(totalCount) / POSTS_PER_PAGE);
                }
              }
            }
          });

          setCache(newCacheData);
          setTotalPages(newTotalPages);

          // Display the active page if we just fetched it
          if (!cache[activePage] && newCacheData[activePage]) {
            context.dispatch({ type: 'SET_NOTES', payload: newCacheData[activePage] });
          }
        }
        
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not connect to the server. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithCache();
    
  }, [activePage, totalPages, context?.dispatch]); // Added totalPages to dependencies

  return { context, isLoading, error, totalPages };
};

// --- UI: Home Page Component (Formerly AppContent) ---
interface HomePageProps {
  token: string | null;
  user: any;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ token, user, onLogout }) => {
  const [activePage, setActivePage] = useState(1);
  const { context, isLoading, error, totalPages } = useNotesData(activePage);
  const [sanitizerEnabled, setSanitizerEnabled] = useState(true);

  if (!context) return null;
  const { state } = context;

  return (
    <div>
      <h1>Web Dev Fun Facts</h1>

      {/* --- Add the Toggle Button --- */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <button 
          data-testid="sanitizer_toggle" 
          onClick={() => setSanitizerEnabled(!sanitizerEnabled)}
          className="btn-secondary"
        >
          Sanitizer: {sanitizerEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* --- Navigation & Auth Header --- */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        {!token ? (
          <div className="guest-nav">
            <Link to="/login">
              <button data-testid="go_to_login_button">Go to Login</button>
            </Link>
            <Link to="/create-user" style={{ marginLeft: '10px' }}>
              <button data-testid="go_to_create_user_button">Create New User</button>
            </Link>
          </div>
        ) : (
          <div className="user-nav">
            <span style={{color: '#334155', marginRight: '15px', fontWeight: 'bold' }}>Welcome, {user?.name}</span>
            <button data-testid="logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="notification" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        {state.notification}
      </div>

      {/* --- NEW: Add Note only visible if logged in --- */}
      {token && (
        <div style={{ marginBottom: '20px' }}>
          <AddNote />
        </div>
      )}

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
        
        {/* --- Pass the state to the Note component --- */}
        {!isLoading && !error && state.notes.length > 0 && (
          state.notes.map((note) => (
            <Note 
              key={note.id} 
              note={note} 
              currentUser={user} 
              sanitizerEnabled={sanitizerEnabled} 
            />
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

// --- UI: Main App Component (Routing & Global State) ---
export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser');
    if (loggedUserJSON) {
      const savedData = JSON.parse(loggedUserJSON);
      setUser({ username: savedData.username, name: savedData.name, email: savedData.email });
      setToken(savedData.token);
    }
  }, []);

  // Automatically attach the token to all outgoing axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleLogout = () => {
    // 1. Clear the React state
    setToken(null);
    setUser(null);
    
    // 2. Clear the browser's permanent storage
    window.localStorage.removeItem('loggedNoteappUser');
  };

  return (
    <NoteProvider>
      <Router>
        <div className="app-container">
          <Switch>
            <Route path="/login">
              <Login setToken={setToken} setUser={setUser} />
            </Route>
            <Route path="/create-user">
              <CreateUser />
            </Route>
            <Route path="/">
              <HomePage token={token} user={user} onLogout={handleLogout} />
            </Route>
          </Switch>
        </div>
      </Router>
    </NoteProvider>
  );
}