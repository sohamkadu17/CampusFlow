import { Response } from 'express';
import { Sponsorship } from '../models/Sponsorship.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

export const createSponsorship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, clubId, sponsorName, sponsorEmail, sponsorPhone, amount, type, deliverables, notes } = req.body;

    if (!sponsorName || !amount || !type) {
      throw new AppError('Please provide sponsor name, amount, and type', 400);
    }

    if (!eventId && !clubId) {
      throw new AppError('Please provide either eventId or clubId', 400);
    }

    const sponsorship = await Sponsorship.create({
      eventId,
      clubId,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      amount,
      type,
      deliverables: deliverables || [],
      notes,
      createdBy: req.user!._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Sponsorship created successfully',
      data: { sponsorship },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create sponsorship',
    });
  }
};

export const getSponsorships = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, clubId, status } = req.query;

    const query: any = {};

    if (eventId) {
      query.eventId = eventId;
    }

    if (clubId) {
      query.clubId = clubId;
    }

    if (status) {
      query.status = status;
    }

    // If user is not admin, only show their created sponsorships
    if (req.user!.role !== 'admin') {
      query.createdBy = req.user!._id;
    }

    const sponsorships = await Sponsorship.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { sponsorships },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get sponsorships',
    });
  }
};

export const getSponsorshipById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      throw new AppError('Sponsorship not found', 404);
    }

    // Check authorization
    if (req.user!.role !== 'admin' && sponsorship.createdBy !== req.user!._id.toString()) {
      throw new AppError('Not authorized to view this sponsorship', 403);
    }

    res.status(200).json({
      success: true,
      data: { sponsorship },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get sponsorship',
    });
  }
};

export const updateSponsorship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      throw new AppError('Sponsorship not found', 404);
    }

    // Check authorization
    if (req.user!.role !== 'admin' && sponsorship.createdBy !== req.user!._id.toString()) {
      throw new AppError('Not authorized to update this sponsorship', 403);
    }

    const updatedSponsorship = await Sponsorship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Sponsorship updated successfully',
      data: { sponsorship: updatedSponsorship },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update sponsorship',
    });
  }
};

export const deleteSponsorship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      throw new AppError('Sponsorship not found', 404);
    }

    // Check authorization
    if (req.user!.role !== 'admin' && sponsorship.createdBy !== req.user!._id.toString()) {
      throw new AppError('Not authorized to delete this sponsorship', 403);
    }

    await Sponsorship.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sponsorship deleted successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete sponsorship',
    });
  }
};

export const approveSponsorship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      throw new AppError('Sponsorship not found', 404);
    }

    sponsorship.status = 'approved';
    await sponsorship.save();

    res.status(200).json({
      success: true,
      message: 'Sponsorship approved successfully',
      data: { sponsorship },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to approve sponsorship',
    });
  }
};
