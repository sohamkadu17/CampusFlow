import { Response } from 'express';
import { Booking } from '../models/Booking.model';
import { Resource } from '../models/Resource.model';
import { Notification } from '../models/Notification.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { emitNotification } from '../config/socket';

// Conflict detection algorithm
const checkForConflicts = async (
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: any[] }> => {
  const query: any = {
    resourceId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      // New booking starts during existing booking
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime },
      },
      // New booking ends during existing booking
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime },
      },
      // New booking completely contains existing booking
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
};

// Find alternative time slots
const findAlternativeSlots = async (
  resourceId: string,
  duration: number,
  date: Date
): Promise<{ start: Date; end: Date }[]> => {
  const alternatives: { start: Date; end: Date }[] = [];
  const startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0); // Start at 8 AM

  const endOfDay = new Date(date);
  endOfDay.setHours(20, 0, 0, 0); // End at 8 PM

  // Get all bookings for the resource on this date
  const bookings = await Booking.find({
    resourceId,
    status: { $in: ['pending', 'approved'] },
    startTime: { $gte: startOfDay, $lt: endOfDay },
  }).sort({ startTime: 1 });

  let currentTime = new Date(startOfDay);

  for (const booking of bookings) {
    const gapDuration = booking.startTime.getTime() - currentTime.getTime();
    if (gapDuration >= duration) {
      alternatives.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + duration),
      });
    }
    currentTime = new Date(booking.endTime);
  }

  // Check if there's time after last booking
  const remainingTime = endOfDay.getTime() - currentTime.getTime();
  if (remainingTime >= duration) {
    alternatives.push({
      start: new Date(currentTime),
      end: new Date(currentTime.getTime() + duration),
    });
  }

  return alternatives.slice(0, 3); // Return top 3 alternatives
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, startTime, endTime, purpose, eventId, eventTitle } = req.body;

    if (!resourceId || !startTime || !endTime || !purpose) {
      throw new AppError('Please provide all required fields', 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      throw new AppError('End time must be after start time', 400);
    }

    // Check for conflicts
    const { hasConflict, conflictingBookings } = await checkForConflicts(resourceId, start, end);

    if (hasConflict) {
      // Calculate duration in milliseconds
      const duration = end.getTime() - start.getTime();

      // Find alternative slots
      const alternatives = await findAlternativeSlots(resourceId, duration, start);

      res.status(409).json({
        success: false,
        message: 'Resource is not available for the selected time slot',
        data: {
          conflicts: conflictingBookings.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            purpose: b.purpose,
          })),
          suggestions: alternatives,
        },
      });
      return;
    }

    // Check if resource exists and get auto-approve setting
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    const booking = await Booking.create({
      resourceId,
      userId: req.user!._id,
      userName: req.user!.name,
      eventId,
      eventTitle,
      startTime: start,
      endTime: end,
      purpose,
      status: resource.autoApprove ? 'approved' : 'pending',
    });

    // If auto-approved, notify user
    if (resource.autoApprove) {
      const notification = await Notification.create({
        userId: req.user!._id,
        type: 'booking_approved',
        title: 'Booking Approved',
        message: `Your booking for ${resource.name} has been automatically approved`,
        link: `/bookings/${booking._id}`,
        metadata: { bookingId: booking._id },
      });

      const io = req.app.get('io');
      if (io) {
        emitNotification(io, req.user!._id.toString(), notification);
      }
    }

    res.status(201).json({
      success: true,
      message: resource.autoApprove
        ? 'Booking created and approved automatically'
        : 'Booking created and pending approval',
      data: { booking },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

export const checkAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, startTime, endTime } = req.body;

    if (!resourceId || !startTime || !endTime) {
      throw new AppError('Please provide resourceId, startTime, and endTime', 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const { hasConflict, conflictingBookings } = await checkForConflicts(resourceId, start, end);

    if (hasConflict) {
      const duration = end.getTime() - start.getTime();
      const alternatives = await findAlternativeSlots(resourceId, duration, start);

      res.status(200).json({
        success: true,
        data: {
          available: false,
          conflicts: conflictingBookings.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            purpose: b.purpose,
          })),
          suggestions: alternatives,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          available: true,
          message: 'Resource is available for the selected time slot',
        },
      });
    }
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to check availability',
    });
  }
};

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, status, startDate, endDate } = req.query;

    const query: any = {};

    if (resourceId) {
      query.resourceId = resourceId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const bookings = await Booking.find(query).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get bookings',
    });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ userId: req.user!._id }).sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get your bookings',
    });
  }
};

export const approveBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    booking.status = 'approved';
    booking.approvedBy = req.user!._id.toString();
    booking.approvedAt = new Date();

    await booking.save();

    // Notify user
    const notification = await Notification.create({
      userId: booking.userId,
      type: 'booking_approved',
      title: 'Booking Approved',
      message: `Your booking has been approved`,
      link: `/bookings/${booking._id}`,
      metadata: { bookingId: booking._id },
    });

    const io = req.app.get('io');
    if (io) {
      emitNotification(io, booking.userId, notification);
    }

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: { booking },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to approve booking',
    });
  }
};

export const rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rejectionReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason;

    await booking.save();

    // Notify user
    const notification = await Notification.create({
      userId: booking.userId,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking has been rejected: ${rejectionReason}`,
      link: `/bookings/${booking._id}`,
      metadata: { bookingId: booking._id },
    });

    const io = req.app.get('io');
    if (io) {
      emitNotification(io, booking.userId, notification);
    }

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      data: { booking },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to reject booking',
    });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.userId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to cancel this booking', 403);
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
};
