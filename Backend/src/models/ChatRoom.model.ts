import mongoose, { Document, Schema } from 'mongoose';

export interface IChatRoom extends Document {

  name: string;
  type: 'direct' | 'group' | 'event' | 'club';
  participants: string[];
  eventId?: string;
  clubId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['direct', 'group', 'event', 'club'],
      required: true,
    },
    participants: [
      {
        type: String,
        ref: 'User',
      },
    ],
    eventId: {
      type: String,
      ref: 'Event',
    },
    clubId: {
      type: String,
    },
    lastMessage: {
      text: String,
      senderId: {
        type: String,
        ref: 'User',
      },
      timestamp: Date,
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

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ eventId: 1 });
chatRoomSchema.index({ clubId: 1 });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
