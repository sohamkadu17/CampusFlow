import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {

  userId: string;
  type: 'event_approved' | 'event_rejected' | 'changes_requested' | 'booking_approved' | 'booking_rejected' | 'new_event' | 'registration_confirmed' | 'event_reminder' | 'budget_approved' | 'message';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: {
    eventId?: string;
    bookingId?: string;
    senderId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'event_approved',
        'event_rejected',
        'changes_requested',
        'booking_approved',
        'booking_rejected',
        'new_event',
        'registration_confirmed',
        'event_reminder',
        'budget_approved',
        'message',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      eventId: String,
      bookingId: String,
      senderId: String,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
