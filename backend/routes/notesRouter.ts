import { Router } from 'express';
import { 
  getNotes, createNote, updateNote, deleteNote,
  getNoteById,
  getNoteByIndex, updateNoteByIndex, deleteNoteByIndex 
} from '../controllers/notesController';
import { requireAuth } from '../middlewares/authMiddleware';
import { filterNotes } from '../controllers/notesFilterController';

const router = Router();

router.get('/filter', filterNotes);

// ==========================================
// PUBLIC ROUTES (Anyone can view)
// ==========================================
router.get('/', getNotes);
router.get('/by-index/:i', getNoteByIndex);
router.get('/:id', getNoteById); // ID route must stay below specific string routes like 'by-index'


// ==========================================
// PROTECTED ROUTES (Require Token)
// ==========================================
router.post('/', requireAuth, createNote);

// Index-Based Updates (Protected)
router.put('/by-index/:i', requireAuth, updateNoteByIndex);
router.delete('/by-index/:i', requireAuth, deleteNoteByIndex);

// ID-Based Updates (Protected)
router.put('/:id', requireAuth, updateNote);
router.delete('/:id', requireAuth, deleteNote);

export default router;