import mongoose, { Document, Schema } from 'mongoose';

export interface ISponsorship extends Document {

  eventId: string;
  clubId?: string;
  sponsorName: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  amount: number;
  type: 'cash' | 'kind' | 'both';
  deliverables: string[];
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const sponsorshipSchema = new Schema<ISponsorship>(
  {
    eventId: {
      type: String,
      ref: 'Event',
    },
    clubId: {
      type: String,
    },
    sponsorName: {
      type: String,
      required: true,
      trim: true,
    },
    sponsorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sponsorPhone: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['cash', 'kind', 'both'],
      required: true,
    },
    deliverables: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

sponsorshipSchema.index({ eventId: 1 });
sponsorshipSchema.index({ clubId: 1 });
sponsorshipSchema.index({ status: 1 });

export const Sponsorship = mongoose.model<ISponsorship>('Sponsorship', sponsorshipSchema);
