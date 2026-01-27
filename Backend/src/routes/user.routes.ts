import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getProfile, updateProfile, uploadProfilePicture, joinClub, leaveClub, getUsers } from '../controllers/user.controller';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/picture', uploadProfilePicture);
router.post('/clubs/join', joinClub);
router.post('/clubs/leave', leaveClub);
router.get('/', getUsers);

export default router;
