import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import {
  getEventAnalytics,
  getClubAnalytics,
  getResourceAnalytics,
  getBudgetAnalytics,
  getUserAnalytics,
  getLeaderboard,
  exportAnalyticsToCSV,
} from '../controllers/analytics.controller';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/events', getEventAnalytics);
router.get('/clubs', getClubAnalytics);
router.get('/resources', getResourceAnalytics);
router.get('/budget', getBudgetAnalytics);
router.get('/users', getUserAnalytics);
router.get('/leaderboard', getLeaderboard);
router.get('/export', exportAnalyticsToCSV);

export default router;
