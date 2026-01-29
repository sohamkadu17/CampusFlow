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

    // Update event registered count
    event.registeredCount += 1;
    await event.save();

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

    // Update event registered count
    if (event) {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
      await event.save();
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

    const registrations = await Registration.find({ eventId });

    // Populate user details
    const registrationsWithUsers = await Promise.all(
      registrations.map(async (reg) => {
        const user = await reg.populate('userId', 'name email department year');
        return user;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        registrations: registrationsWithUsers,
        total: registrations.length,
        attended: registrations.filter((r) => r.attended).length,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get event registrations',
    });
  }
};
