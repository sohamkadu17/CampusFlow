import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  registerForEvent,
  getMyRegistrations,
  unregisterFromEvent,
  checkInAttendee,
  getEventRegistrations,
  exportRegistrations,
} from '../controllers/registration.controller';

const router = Router();

router.use(protect);

router.post('/', registerForEvent);
router.get('/my', getMyRegistrations);
router.delete('/:eventId', unregisterFromEvent);
router.post('/checkin', checkInAttendee);
router.get('/event/:eventId', getEventRegistrations);
router.get('/event/:eventId/export', exportRegistrations);

export default router;
