import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  submitEventForApproval,
  approveEvent,
  rejectEvent,
  requestChanges,
  getPendingEvents,
  getMyEvents,
  uploadRulebook as uploadRulebookController,
  uploadPoster as uploadPosterController,
} from '../controllers/event.controller';
import { uploadRulebook, uploadEventImage } from '../config/cloudinary';

const router = Router();

router.use(protect); // All routes require authentication

// Admin routes (must come before dynamic :id routes)
router.get('/admin/pending', restrictTo('admin'), getPendingEvents);
router.post('/:id/approve', restrictTo('admin'), approveEvent);
router.post('/:id/reject', restrictTo('admin'), rejectEvent);
router.post('/:id/request-changes', restrictTo('admin'), requestChanges);

// Organizer routes
router.get('/my/events', restrictTo('organizer', 'admin'), getMyEvents);
router.post('/:id/submit', restrictTo('organizer'), submitEventForApproval);
router.post('/:id/rulebook', restrictTo('organizer', 'admin'), uploadRulebook.single('rulebook'), uploadRulebookController);
router.post('/:id/poster', restrictTo('organizer', 'admin'), uploadEventImage.single('poster'), uploadPosterController);

// Public event routes (authenticated users)
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', restrictTo('organizer', 'admin'), createEvent);
router.put('/:id', restrictTo('organizer', 'admin'), updateEvent);
router.delete('/:id', restrictTo('organizer', 'admin'), deleteEvent);

export default router;
