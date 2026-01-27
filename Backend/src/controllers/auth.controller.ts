import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { generateToken, generateRefreshToken } from '../utils/token.utils';
import { generateOTP, generateRandomToken, hashToken } from '../utils/crypto.utils';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/email.utils';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, department, year } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      department,
      year,
      otp,
      otpExpires,
      isVerified: false,
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for OTP verification.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const verifyOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Please provide email and OTP', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isVerified) {
      throw new AppError('Email already verified', 400);
    }

    if (!user.otp || !user.otpExpires) {
      throw new AppError('OTP not found or expired', 400);
    }

    if (user.otpExpires < new Date()) {
      throw new AppError('OTP has expired', 400);
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          year: user.year,
          profilePicture: user.profilePicture,
          clubs: user.clubs,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'OTP verification failed',
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new AppError('Please verify your email first', 401);
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          year: user.year,
          profilePicture: user.profilePicture,
          clubs: user.clubs,
          profileVisibility: user.profileVisibility,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Please provide email', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('No user found with this email', 404);
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const hashedResetToken = hashToken(resetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw new AppError('Error sending password reset email', 500);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to process forgot password request',
    });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Please provide token and new password', 400);
    }

    // Hash the token from URL
    const hashedToken = hashToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Please provide refresh token', 400);
    }

    // Verify refresh token (implementation depends on your token strategy)
    const token = generateToken(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Token refresh failed',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
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
      message: error.message || 'Failed to get user data',
    });
  }
};
