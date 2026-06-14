import { Router } from 'express';
import { deleteAllNotes } from '../controllers/notesController';

const router = Router();

// DELETE /test/reset - Deletes all notes in the database
router.delete('/reset', deleteAllNotes);

export default router;