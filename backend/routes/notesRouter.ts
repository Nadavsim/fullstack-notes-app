import { Router } from 'express';
import { 
  getNotes, createNote, updateNote, deleteNote,
  getNoteById,
  getNoteByIndex, updateNoteByIndex, deleteNoteByIndex 
} from '../controllers/notesController';

const router = Router();

// --- General Routes ---
router.get('/', getNotes);
router.post('/', createNote);

// --- Index-Based Routes (Must come BEFORE ID routes) ---
router.get('/by-index/:i', getNoteByIndex);
router.put('/by-index/:i', updateNoteByIndex);
router.delete('/by-index/:i', deleteNoteByIndex);

// --- ID-Based Routes (Must come LAST) ---
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;