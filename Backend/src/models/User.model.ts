import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'organizer' | 'admin';
  department?: string;
  year?: number;
  profilePicture?: string;
  phone?: string;
  clubs: Array<{
    clubId: string;
    clubName: string;
    role: 'member' | 'admin' | 'lead';
    joinedAt: Date;
  }>;
  profileVisibility: 'public' | 'internal' | 'private';
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    profilePicture: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    clubs: [
      {
        clubId: {
          type: String,
          required: true,
        },
        clubName: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'admin', 'lead'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    profileVisibility: {
      type: String,
      enum: ['public', 'internal', 'private'],
      default: 'internal',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (email already indexed via unique: true)
userSchema.index({ 'clubs.clubId': 1 });

export const User = mongoose.model<IUser>('User', userSchema);
