import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {

  name: string;
  type: 'room' | 'hall' | 'lab' | 'equipment';
  description?: string;
  capacity?: number;
  location?: string;
  features: string[];
  autoApprove: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['room', 'hall', 'lab', 'equipment'],
      required: true,
    },
    description: {
      type: String,
    },
    capacity: {
      type: Number,
    },
    location: {
      type: String,
    },
    features: [
      {
        type: String,
      },
    ],
    autoApprove: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ type: 1, isAvailable: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
