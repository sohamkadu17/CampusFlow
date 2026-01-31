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
  getUserEngagement,
  getEventTrends,
  getClubGrowth,
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
router.get('/engagement', getUserEngagement);
router.get('/trends', getEventTrends);
router.get('/club-growth', getClubGrowth);

export default router;
