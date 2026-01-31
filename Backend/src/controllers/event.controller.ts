import { Response } from 'express';
import { Event } from '../models/Event.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { sendEventApprovalEmail } from '../utils/email.utils';
import { emitNotification } from '../config/socket';

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      clubs,
      startDate,
      endDate,
      date,
      time,
      venue,
      capacity,
      tags,
      budget,
      resources,
      isJointEvent,
      rulebookUrl,
      formLink,
      imageUrl,
    } = req.body;

    if (!title || !description || !category || !(startDate || date) || !venue || !capacity) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Handle both old (date/time) and new (startDate/endDate) formats
    const eventDate = startDate ? new Date(startDate) : new Date(date);
    const eventTime = startDate 
      ? new Date(startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) 
      : (time || '12:00 PM');

    const event = await Event.create({
      title,
      description,
      category,
      organizerId: req.user!._id,
      organizerName: req.user!.name,
      clubs: clubs || [],
      date: eventDate,
      time: eventTime,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      venue,
      capacity,
      tags: tags || [],
      budget: budget || { requested: 0, expenses: [] },
      resources: resources || [],
      isJointEvent: isJointEvent || false,
      status: 'draft',
      rulebookUrl: rulebookUrl || undefined,
      formLink: formLink || undefined,
      imageUrl: imageUrl || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create event',
    });
  }
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, status, search, page = 1, limit = 20, venue } = req.query;

    const query: any = {};

    // Only filter by status if explicitly provided
    if (status) {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // Add venue filter for availability checking
    if (venue) {
      query.venue = venue;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: 1 });

    const total = await Event.countDocuments(query);

    // Check if user is registered for each event
    let eventsWithRegistrationStatus: any[] = events;
    if (req.user) {
      const { Registration } = require('../models/Registration.model');
      const userRegistrations = await Registration.find({ userId: req.user._id }).select('eventId');
      const registeredEventIds = new Set(userRegistrations.map((r: any) => r.eventId.toString()));
      
      eventsWithRegistrationStatus = events.map(event => {
        const eventObj = event.toObject();
        return {
          ...eventObj,
          isRegistered: registeredEventIds.has(event._id.toString())
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithRegistrationStatus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get events',
    });
  }
};

export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get event',
    });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is the organizer or admin
    if (event.organizerId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to update this event', 403);
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update event',
    });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is the organizer or admin
    if (event.organizerId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to delete this event', 403);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete event',
    });
  }
};

export const submitEventForApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Fix: Convert both to strings for proper comparison
    if (event.organizerId.toString() !== req.user!._id.toString()) {
      throw new AppError('Not authorized to submit this event', 403);
    }

    if (event.status !== 'draft') {
      throw new AppError('Event is not in draft status', 400);
    }

    event.status = 'pending';
    await event.save();

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'new_event',
        title: 'New Event Pending Approval',
        message: `${event.title} has been submitted for approval by ${req.user!.name}`,
        link: `/admin/events/${event._id}`,
        metadata: { eventId: event._id },
      });

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        emitNotification(io, admin._id.toString(), notification);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event submitted for approval',
      data: { event },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to submit event',
    });
  }
};

export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    event.status = 'approved';
    event.adminReview = {
      reviewedBy: req.user!._id.toString(),
      reviewedAt: new Date(),
      status: 'approved',
      notes: req.body.notes,
    };

    await event.save();

    // Notify organizer
    console.log('Creating notification for organizer:', event.organizerId);
    const notification = await Notification.create({
      userId: event.organizerId,
      type: 'event_approved',
      title: 'Event Approved!',
      message: `Your event "${event.title}" has been approved`,
      link: `/organizer/events/${event._id}`,
      metadata: { eventId: event._id },
    });
    console.log('Notification created:', notification._id);

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting notification via Socket.IO to user:', event.organizerId.toString());
      emitNotification(io, event.organizerId.toString(), notification);
    } else {
      console.error('❌ Socket.IO instance not found on app');
    }

    // Send email
    const organizer = await User.findById(event.organizerId);
    if (organizer) {
      try {
        await sendEventApprovalEmail(organizer.email, event.title, 'approved', req.body.notes);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event approved successfully',
      data: { event },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to approve event',
    });
  }
};

export const rejectEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    event.status = 'rejected';
    event.adminReview = {
      reviewedBy: req.user!._id.toString(),
      reviewedAt: new Date(),
      status: 'rejected',
      notes,
    };

    await event.save();

    // Notify organizer
    const notification = await Notification.create({
      userId: event.organizerId,
      type: 'event_rejected',
      title: 'Event Rejected',
      message: `Your event "${event.title}" has been rejected`,
      link: `/organizer/events/${event._id}`,
      metadata: { eventId: event._id },
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      emitNotification(io, event.organizerId, notification);
    }

    // Send email
    const organizer = await User.findById(event.organizerId);
    if (organizer) {
      try {
        await sendEventApprovalEmail(organizer.email, event.title, 'rejected', notes);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event rejected',
      data: { event },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to reject event',
    });
  }
};

export const requestChanges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    event.status = 'changes-requested';
    event.adminReview = {
      reviewedBy: req.user!._id.toString(),
      reviewedAt: new Date(),
      status: 'changes-requested',
      notes,
    };

    await event.save();

    // Notify organizer
    const notification = await Notification.create({
      userId: event.organizerId,
      type: 'changes_requested',
      title: 'Changes Requested',
      message: `Changes requested for "${event.title}"`,
      link: `/organizer/events/${event._id}`,
      metadata: { eventId: event._id },
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      emitNotification(io, event.organizerId, notification);
    }

    // Send email
    const organizer = await User.findById(event.organizerId);
    if (organizer) {
      try {
        await sendEventApprovalEmail(organizer.email, event.title, 'changes-requested', notes);
      } catch (emailError) {
        console.error('Failed to send changes requested email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Changes requested',
      data: { event },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to request changes',
    });
  }
};

export const getPendingEvents = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ status: 'pending' }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get pending events',
    });
  }
};

export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ organizerId: req.user!._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get your events',
    });
  }
};

export const uploadRulebook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a PDF file', 400);
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizerId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to upload rulebook for this event', 403);
    }

    event.rulebookUrl = req.file.path;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Rulebook uploaded successfully',
      data: { rulebookUrl: event.rulebookUrl },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload rulebook',
    });
  }
};

export const uploadPoster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Upload poster called. File:', req.file);
    console.log('Event ID:', req.params.id);
    console.log('User:', req.user);
    
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizerId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to upload poster for this event', 403);
    }

    event.imageUrl = req.file.path;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Poster uploaded successfully',
      data: { imageUrl: event.imageUrl },
    });
  } catch (error: any) {
    console.error('Upload poster error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload poster',
    });
  }
};
