import { createContext, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { Note } from '../types';

// Types
type State = { notes: Note[]; notification: string };

type Action = 
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'SET_NOTIFICATION'; payload: string };

// Initial State matching the requirements
const initialState: State = { 
  notes: [], 
  notification: 'Notification area' 
};

// Reducer
const noteReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_NOTES': 
      return { ...state, notes: action.payload };
    case 'ADD_NOTE': 
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'SET_NOTIFICATION': 
      return { ...state, notification: action.payload };
    case 'DELETE_NOTE': 
      return { ...state, notes: state.notes.filter((note) => note._id !== action.payload) };
    case 'UPDATE_NOTE': 
      return { ...state, notes: state.notes.map((note) => (note._id === action.payload._id ? action.payload : note)) };
    default: 
      return state;
  }
};

// Context
export const NoteContext = createContext<{ state: State; dispatch: Dispatch<Action> } | undefined>(undefined);

// Provider
export const NoteProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(noteReducer, initialState);
  return (
    <NoteContext.Provider value={{ state, dispatch }}>
      {children}
    </NoteContext.Provider>
  );
};