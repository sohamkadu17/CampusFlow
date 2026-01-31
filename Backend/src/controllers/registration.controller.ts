import { Response } from 'express';
import { Registration } from '../models/Registration.model';
import { Event } from '../models/Event.model';
import { Notification } from '../models/Notification.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { generateQRCode, generateRegistrationNumber } from '../utils/qr.utils';
import { emitNotification } from '../config/socket';

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      throw new AppError('Please provide event ID', 400);
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if event is approved
    if (event.status !== 'approved') {
      throw new AppError(`Event is not open for registration. Current status: ${event.status}`, 400);
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      userId: req.user!._id,
      eventId,
    });

    if (existingRegistration) {
      throw new AppError('Already registered for this event', 400);
    }

    // Check capacity
    if (event.registeredCount >= event.capacity) {
      throw new AppError('Event is full', 400);
    }

    // Generate registration number and QR code
    const registrationNumber = generateRegistrationNumber();
    const qrData = JSON.stringify({
      registrationNumber,
      eventId,
      userId: req.user!._id,
      eventTitle: event.title,
      userName: req.user!.name,
    });
    const qrCode = await generateQRCode(qrData);

    // Create registration
    const registration = await Registration.create({
      userId: req.user!._id,
      eventId,
      qrCode,
      registrationNumber,
    });

    console.log('Registration created:', {
      id: registration._id,
      userId: req.user!._id,
      eventId,
      registrationNumber,
      timestamp: new Date().toISOString()
    });

    // Update event registered count
    event.registeredCount += 1;
    await event.save();

    console.log('Event updated:', {
      eventId,
      eventTitle: event.title,
      newRegisteredCount: event.registeredCount,
      capacity: event.capacity,
      timestamp: new Date().toISOString()
    });

    // Verify the registration was saved
    const savedRegistration = await Registration.findById(registration._id);
    if (!savedRegistration) {
      throw new AppError('Failed to save registration', 500);
    }

    // Verify the event count was updated
    const updatedEvent = await Event.findById(eventId);
    if (!updatedEvent || updatedEvent.registeredCount !== event.registeredCount) {
      throw new AppError('Failed to update event registration count', 500);
    }

    // Create notification
    const notification = await Notification.create({
      userId: req.user!._id,
      type: 'registration_confirmed',
      title: 'Registration Confirmed',
      message: `You have successfully registered for ${event.title}`,
      link: `/events/${eventId}`,
      metadata: { eventId },
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      emitNotification(io, req.user!._id.toString(), notification);
    }

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: { registration },
    });
  } catch (error: any) {
    console.error('Registration error:', {
      message: error.message,
      statusCode: error.statusCode,
      userId: req.user?._id,
      eventId: req.body?.eventId
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to register for event',
    });
  }
};

export const getMyRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.user!._id }).sort({
      createdAt: -1,
    });

    console.log('Fetching registrations for user:', {
      userId: req.user!._id,
      count: registrations.length,
      timestamp: new Date().toISOString()
    });

    // Populate event details
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await Event.findById(reg.eventId);
        return {
          ...reg.toObject(),
          event,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { registrations: registrationsWithEvents },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get registrations',
    });
  }
};

export const unregisterFromEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const registration = await Registration.findOne({
      userId: req.user!._id,
      eventId,
    });

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    // Check if event has already happened
    const event = await Event.findById(eventId);
    if (event && new Date(event.date) < new Date()) {
      throw new AppError('Cannot unregister from past events', 400);
    }

    // Delete registration
    await Registration.findByIdAndDelete(registration._id);

    console.log('Registration deleted:', {
      registrationId: registration._id,
      userId: req.user!._id,
      eventId,
      timestamp: new Date().toISOString()
    });

    // Update event registered count
    if (event) {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
      await event.save();

      console.log('Event count decremented:', {
        eventId,
        eventTitle: event.title,
        newRegisteredCount: event.registeredCount,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from event',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to unregister',
    });
  }
};

export const checkInAttendee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
      throw new AppError('Please provide registration number', 400);
    }

    const registration = await Registration.findOne({ registrationNumber });

    if (!registration) {
      throw new AppError('Invalid registration number', 404);
    }

    if (registration.attended) {
      throw new AppError('Already checked in', 400);
    }

    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: { registration },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to check in',
    });
  }
};

export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const registrations = await Registration.find({ eventId })
      .populate('userId', 'name email department year')
      .sort({ createdAt: -1 });

    console.log('Fetching registrations for event:', {
      eventId,
      count: registrations.length,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: registrations,
      total: registrations.length,
      attended: registrations.filter((r) => r.attended).length,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get event registrations',
    });
  }
};

/**
 * Export registrations as CSV
 * GET /api/events/:eventId/registrations/export
 */
export const exportRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Check permissions
    if (req.user!.role !== 'admin' && req.user!.role !== 'organizer') {
      throw new AppError('Not authorized to export registrations', 403);
    }

    const registrations = await Registration.find({ eventId }).populate('userId', 'name email');

    // Generate CSV
    const csvHeaders = 'Name,Email,Registration Number,Registered At,Attended\n';
    const csvRows = registrations.map((reg) => {
      const user = reg.userId as any;
      return [
        user?.name || 'N/A',
        user?.email || 'N/A',
        reg.registrationNumber || '',
        reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '',
        reg.attended ? 'Yes' : 'No',
      ].join(',');
    }).join('\n');

    const csv = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${eventId}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to export registrations',
    });
  }
};
