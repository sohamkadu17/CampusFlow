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
  uploadRulebook,
} from '../controllers/event.controller';

const router = Router();

router.use(protect); // All routes require authentication

// Public event routes (authenticated users)
router.get('/', getEvents);
router.get('/:id', getEventById);

// Organizer routes
router.post('/', restrictTo('organizer', 'admin'), createEvent);
router.put('/:id', restrictTo('organizer', 'admin'), updateEvent);
router.delete('/:id', restrictTo('organizer', 'admin'), deleteEvent);
router.post('/:id/submit', restrictTo('organizer'), submitEventForApproval);
router.post('/:id/rulebook', restrictTo('organizer', 'admin'), uploadRulebook);
router.get('/my/events', restrictTo('organizer', 'admin'), getMyEvents);

// Admin routes
router.get('/admin/pending', restrictTo('admin'), getPendingEvents);
router.post('/:id/approve', restrictTo('admin'), approveEvent);
router.post('/:id/reject', restrictTo('admin'), rejectEvent);
router.post('/:id/request-changes', restrictTo('admin'), requestChanges);

export default router;
