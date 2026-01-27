import { Response } from 'express';
import { Certificate } from '../models/Certificate.model';
import { Event } from '../models/Event.model';
import { Registration } from '../models/Registration.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

const generateCertificateNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
};

export const generateCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, eventId, type, metadata } = req.body;

    if (!userId || !eventId || !type) {
      throw new AppError('Please provide userId, eventId, and type', 400);
    }

    // Verify event exists and is completed
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is authorized (admin or event organizer)
    if (req.user!.role !== 'admin' && event.organizerId !== req.user!._id.toString()) {
      throw new AppError('Not authorized to generate certificates for this event', 403);
    }

    // For participation certificates, verify user attended
    if (type === 'participation') {
      const registration = await Registration.findOne({ userId, eventId, attended: true });
      if (!registration) {
        throw new AppError('User did not attend this event', 400);
      }
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ userId, eventId, type });
    if (existingCert) {
      throw new AppError('Certificate already exists for this user and event', 400);
    }

    const certificateNumber = generateCertificateNumber();

    const certificate = await Certificate.create({
      userId,
      eventId,
      type,
      certificateNumber,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: { certificate },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate certificate',
    });
  }
};

export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certificates = await Certificate.find({ userId: req.user!._id }).sort({
      issuedDate: -1,
    });

    // Populate event details
    const certificatesWithEvents = await Promise.all(
      certificates.map(async (cert) => {
        const event = await Event.findById(cert.eventId);
        return {
          ...cert.toObject(),
          event,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { certificates: certificatesWithEvents },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get certificates',
    });
  }
};

export const getCertificateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    // Verify user is authorized to view (certificate owner or admin)
    if (certificate.userId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to view this certificate', 403);
    }

    // Populate event and user details
    const event = await Event.findById(certificate.eventId);

    res.status(200).json({
      success: true,
      data: {
        certificate,
        event,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get certificate',
    });
  }
};

export const downloadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    // Verify user is authorized
    if (certificate.userId !== req.user!._id.toString() && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to download this certificate', 403);
    }

    // Get event and user details
    const event = await Event.findById(certificate.eventId);
    const user = await require('../models/User.model').User.findById(certificate.userId);

    if (!event || !user) {
      throw new AppError('Event or user data not found', 404);
    }

    // Return certificate data for frontend PDF generation
    // Frontend will use jsPDF to generate the actual PDF
    res.status(200).json({
      success: true,
      data: {
        certificate: {
          certificateNumber: certificate.certificateNumber,
          type: certificate.type,
          issuedDate: certificate.issuedDate,
          metadata: certificate.metadata,
        },
        event: {
          title: event.title,
          date: event.date,
          organizerName: event.organizerName,
        },
        user: {
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to download certificate',
    });
  }
};
