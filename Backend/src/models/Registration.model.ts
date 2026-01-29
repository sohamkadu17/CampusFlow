import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistration extends Document {

  userId: string;
  eventId: string;
  qrCode: string;
  attended: boolean;
  attendedAt?: Date;
  registrationNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
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
    qrCode: {
      type: String,
      required: true,
    },
    attended: {
      type: Boolean,
      default: false,
    },
    attendedAt: {
      type: Date,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one user can register only once per event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
