import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {

  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: {
      type: String,
      required: true,
      ref: 'ChatRoom',
    },
    senderId: {
      type: String,
      required: true,
      ref: 'User',
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
    readBy: [
      {
        type: String,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ roomId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
