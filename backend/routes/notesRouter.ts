import { Router } from 'express';
import { 
  getNotes, createNote, updateNote, deleteNote,
  getNoteById,
  getNoteByIndex, updateNoteByIndex, deleteNoteByIndex 
} from '../controllers/notesController';
import { requireAuth } from '../middlewares/authMiddleware';
import { filterNotes } from '../controllers/notesFilterController';
import { validate } from '../middlewares/validate';
import { noteBodySchema, idParamSchema, indexParamSchema, listQuerySchema, filterQuerySchema } from '../schemas/notesSchemas';

const router = Router();

router.get('/filter', validate({ query: filterQuerySchema }), filterNotes);

// ==========================================
// PUBLIC ROUTES (Anyone can view)
// ==========================================
router.get('/', validate({ query: listQuerySchema }), getNotes);
router.get('/by-index/:i', validate({ params: indexParamSchema }), getNoteByIndex);
router.get('/:id', validate({ params: idParamSchema }), getNoteById); // ID route must stay below specific string routes like 'by-index'


// ==========================================
// PROTECTED ROUTES (Require Token)
// ==========================================
router.post('/', requireAuth, validate({ body: noteBodySchema }), createNote);

// Index-Based Updates (Protected)
router.put('/by-index/:i', requireAuth, validate({ params: indexParamSchema, body: noteBodySchema }), updateNoteByIndex);
router.delete('/by-index/:i', requireAuth, validate({ params: indexParamSchema }), deleteNoteByIndex);

// ID-Based Updates (Protected)
router.put('/:id', requireAuth, validate({ params: idParamSchema, body: noteBodySchema }), updateNote);
router.delete('/:id', requireAuth, validate({ params: idParamSchema }), deleteNote);

export default router;