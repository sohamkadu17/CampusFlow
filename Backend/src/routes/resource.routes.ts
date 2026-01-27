import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resource.controller';
import {
  createBooking,
  getBookings,
  getMyBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
  checkAvailability,
} from '../controllers/booking.controller';

const router = Router();

router.use(protect);

// Resource routes
router.get('/resources', getResources);
router.get('/resources/:id', getResourceById);
router.post('/resources', restrictTo('admin'), createResource);
router.put('/resources/:id', restrictTo('admin'), updateResource);
router.delete('/resources/:id', restrictTo('admin'), deleteResource);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', restrictTo('admin'), getBookings);
router.get('/bookings/my', getMyBookings);
router.post('/bookings/:id/approve', restrictTo('admin'), approveBooking);
router.post('/bookings/:id/reject', restrictTo('admin'), rejectBooking);
router.post('/bookings/:id/cancel', cancelBooking);
router.post('/bookings/check-availability', checkAvailability);

export default router;
