import { Response } from 'express';
import { Resource } from '../models/Resource.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

export const getResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, isAvailable } = req.query;

    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const resources = await Resource.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { resources },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get resources',
    });
  }
};

export const getResourceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { resource },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get resource',
    });
  }
};

export const createResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, description, capacity, location, features, autoApprove } = req.body;

    if (!name || !type) {
      throw new AppError('Please provide name and type', 400);
    }

    const resource = await Resource.create({
      name,
      type,
      description,
      capacity,
      location,
      features: features || [],
      autoApprove: autoApprove || false,
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create resource',
    });
  }
};

export const updateResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update resource',
    });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete resource',
    });
  }
};
