import { Response } from 'express';
import { Event } from '../models/Event.model';
import { Registration } from '../models/Registration.model';
import { User } from '../models/User.model';
import { Booking } from '../models/Booking.model';
import { AuthRequest } from '../middlewares/auth.middleware';
// @ts-ignore
import { Parser } from 'json2csv';

export const getEventAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ status: 'approved' });
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });

    // Events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Total registrations
    const totalRegistrations = await Registration.countDocuments();
    const totalAttendance = await Registration.countDocuments({ attended: true });

    // Monthly event trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const eventTrends = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Average capacity utilization
    const capacityAnalysis = await Event.aggregate([
      {
        $match: { status: 'approved' },
      },
      {
        $project: {
          utilization: {
            $multiply: [{ $divide: ['$registeredCount', '$capacity'] }, 100],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgUtilization: { $avg: '$utilization' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalEvents,
          approvedEvents,
          pendingEvents,
          completedEvents,
          totalRegistrations,
          totalAttendance,
          attendanceRate: totalRegistrations ? (totalAttendance / totalRegistrations) * 100 : 0,
        },
        eventsByCategory,
        eventTrends,
        avgCapacityUtilization: capacityAnalysis[0]?.avgUtilization || 0,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get event analytics',
    });
  }
};

export const getClubAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all unique clubs from users
    const users = await User.find({}, 'clubs');
    const clubStats: any = {};

    users.forEach((user) => {
      user.clubs.forEach((club) => {
        if (!clubStats[club.clubId]) {
          clubStats[club.clubId] = {
            clubId: club.clubId,
            clubName: club.clubName,
            memberCount: 0,
            adminCount: 0,
            leadCount: 0,
          };
        }

        clubStats[club.clubId].memberCount++;
        if (club.role === 'admin') clubStats[club.clubId].adminCount++;
        if (club.role === 'lead') clubStats[club.clubId].leadCount++;
      });
    });

    // Get events by club
    const eventsPerClub = await Event.aggregate([
      { $unwind: '$clubs' },
      {
        $group: {
          _id: '$clubs.clubId',
          clubName: { $first: '$clubs.clubName' },
          eventCount: { $sum: 1 },
        },
      },
    ]);

    // Merge club stats with event counts
    const clubAnalytics = Object.values(clubStats).map((club: any) => {
      const eventData = eventsPerClub.find((e) => e._id === club.clubId);
      return {
        clubName: club.clubName,
        metrics: {
          memberCount: club.memberCount,
          eventCount: eventData?.eventCount || 0,
          adminCount: club.adminCount,
          leadCount: club.leadCount,
        }
      };
    });

    // Sort by member count and take top 10
    const topClubs = clubAnalytics
      .sort((a, b) => b.metrics.memberCount - a.metrics.memberCount)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: { 
        clubStats: {},
        topClubs: topClubs
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get club analytics',
    });
  }
};

export const getResourceAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalBookings = await Booking.countDocuments();
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Bookings by resource
    const bookingsByResource = await Booking.aggregate([
      {
        $group: {
          _id: '$resourceId',
          bookingCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      { $unwind: '$resource' },
      {
        $project: {
          resourceId: '$_id',
          resourceName: '$resource.name',
          resourceType: '$resource.type',
          bookingCount: 1,
        },
      },
      { $sort: { bookingCount: -1 } },
    ]);

    // Calculate utilization rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBookings,
          approvedBookings,
          pendingBookings,
          recentBookings,
        },
        bookingsByResource,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get resource analytics',
    });
  }
};

export const getBudgetAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const budgetSummary = await Event.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRequested: { $sum: '$budget.requested' },
          totalApproved: { $sum: '$budget.approved' },
          totalSpent: { $sum: '$budget.spent' },
          eventCount: { $sum: 1 },
        },
      },
    ]);

    // Budget by category
    const budgetByCategory = await Event.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$category',
          totalRequested: { $sum: '$budget.requested' },
          totalApproved: { $sum: '$budget.approved' },
          totalSpent: { $sum: '$budget.spent' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: budgetSummary[0] || {
          totalRequested: 0,
          totalApproved: 0,
          totalSpent: 0,
          eventCount: 0,
        },
        byCategory: budgetByCategory,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get budget analytics',
    });
  }
};

export const getLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Most active clubs (by event count)
    const topClubs = await Event.aggregate([
      { $unwind: '$clubs' },
      {
        $group: {
          _id: '$clubs.clubId',
          clubName: { $first: '$clubs.clubName' },
          eventCount: { $sum: 1 },
        },
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
    ]);

    // Most active students (by registration count)
    const topStudents = await Registration.aggregate([
      {
        $group: {
          _id: '$userId',
          registrationCount: { $sum: 1 },
          attendanceCount: {
            $sum: { $cond: ['$attended', 1, 0] },
          },
        },
      },
      { $sort: { registrationCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          department: '$user.department',
          registrationCount: 1,
          attendanceCount: 1,
        },
      },
    ]);

    // Most active organizers
    const topOrganizers = await Event.aggregate([
      {
        $group: {
          _id: '$organizerId',
          organizerName: { $first: '$organizerName' },
          eventCount: { $sum: 1 },
        },
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        topClubs,
        topStudents,
        topOrganizers,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get leaderboard',
    });
  }
};

export const getUserAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const organizerCount = await User.countDocuments({ role: 'organizer' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Users by department
    const usersByDepartment = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          studentCount,
          organizerCount,
          adminCount,
          recentUsers,
        },
        usersByDepartment,
        roleDistribution: [
          { role: 'Student', count: studentCount },
          { role: 'Organizer', count: organizerCount },
          { role: 'Admin', count: adminCount },
        ],
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get user analytics',
    });
  }
};

export const exportAnalyticsToCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type = 'events' } = req.query;

    let data: any[] = [];
    let fields: string[] = [];

    if (type === 'events') {
      data = await Event.find().lean();
      fields = [
        'title',
        'category',
        'organizerName',
        'date',
        'venue',
        'capacity',
        'registeredCount',
        'status',
        'budget.requested',
        'budget.approved',
        'budget.spent',
      ];
    } else if (type === 'registrations') {
      data = await Registration.find().populate('userId', 'name email').lean();
      fields = ['userId.name', 'userId.email', 'eventId', 'registrationNumber', 'attended', 'createdAt'];
    } else if (type === 'bookings') {
      data = await Booking.find().lean();
      fields = ['userName', 'resourceId', 'startTime', 'endTime', 'purpose', 'status'];
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to export analytics',
    });
  }
};
