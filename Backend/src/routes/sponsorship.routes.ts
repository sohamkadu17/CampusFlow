import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import {
  createSponsorship,
  getSponsorships,
  getSponsorshipById,
  updateSponsorship,
  deleteSponsorship,
  approveSponsorship,
} from '../controllers/sponsorship.controller';

const router = Router();

router.use(protect);

router.post('/', restrictTo('organizer', 'admin'), createSponsorship);
router.get('/', getSponsorships);
router.get('/:id', getSponsorshipById);
router.put('/:id', restrictTo('organizer', 'admin'), updateSponsorship);
router.delete('/:id', restrictTo('organizer', 'admin'), deleteSponsorship);
router.post('/:id/approve', restrictTo('admin'), approveSponsorship);

export default router;
