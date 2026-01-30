import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  resourceId: string;
  userId: string;
  userName: string;
  clubName?: string;
  eventId?: string;
  eventTitle?: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    resourceId: {
      type: String,
      required: true,
      ref: 'Resource',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    userName: {
      type: String,
      required: true,
    },
    clubName: {
      type: String,
    },
    eventId: {
      type: String,
      ref: 'Event',
    },
    eventTitle: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: {
      type: String,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for conflict detection
bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
