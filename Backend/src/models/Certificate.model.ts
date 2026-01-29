import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {

  userId: string;
  eventId: string;
  type: 'participation' | 'winner' | 'runner_up' | 'organizer';
  certificateNumber: string;
  issuedDate: Date;
  downloadUrl?: string;
  metadata?: {
    position?: string;
    achievement?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    eventId: {
      type: String,
      required: true,
      ref: 'Event',
    },
    type: {
      type: String,
      enum: ['participation', 'winner', 'runner_up', 'organizer'],
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    downloadUrl: {
      type: String,
    },
    metadata: {
      position: String,
      achievement: String,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ userId: 1 });
certificateSchema.index({ eventId: 1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
