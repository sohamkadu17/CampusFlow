import { Response } from 'express';
import { User } from '../models/User.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, department, year, phone, profileVisibility } = req.body;

    const user = await User.findById(req.user!._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update fields if provided
    if (name) user.name = name;
    if (department) user.department = department;
    if (year) user.year = year;
    if (phone) user.phone = phone;
    if (profileVisibility) user.profileVisibility = profileVisibility;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          year: user.year,
          phone: user.phone,
          profilePicture: user.profilePicture,
          profileVisibility: user.profileVisibility,
          clubs: user.clubs,
        },
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image', 400);
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update profile picture URL from Cloudinary
    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { profilePicture: user.profilePicture },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture',
    });
  }
};

export const joinClub = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clubId, clubName, role = 'member' } = req.body;

    if (!clubId || !clubName) {
      throw new AppError('Please provide club ID and name', 400);
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already a member
    const existingMembership = user.clubs.find((club) => club.clubId === clubId);
    if (existingMembership) {
      throw new AppError('Already a member of this club', 400);
    }

    // Add club membership
    user.clubs.push({
      clubId,
      clubName,
      role,
      joinedAt: new Date(),
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined club',
      data: { clubs: user.clubs },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to join club',
    });
  }
};

export const leaveClub = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clubId } = req.body;

    if (!clubId) {
      throw new AppError('Please provide club ID', 400);
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove club membership
    user.clubs = user.clubs.filter((club) => club.clubId !== clubId);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left club',
      data: { clubs: user.clubs },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to leave club',
    });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, department, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (department) {
      query.department = department;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
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
      message: error.message || 'Failed to get users',
    });
  }
};
