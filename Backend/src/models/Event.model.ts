import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {

  title: string;
  description: string;
  category: 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Seminar' | 'Other';
  organizerId: string;
  organizerName: string;
  clubs: Array<{
    clubId: string;
    clubName: string;
    contribution?: string;
    role?: 'primary' | 'collaborator'; // Primary organizer vs collaborating club
    status?: 'pending' | 'accepted' | 'declined'; // Invitation status
  }>;
  date: Date;
  time: string;
  startDate?: Date;
  endDate?: Date;
  venue: string;
  capacity: number;
  registeredCount: number;
  imageUrl?: string;
  rulebookUrl?: string;
  formLink: string;
  tags: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'changes-requested' | 'live';
  budget: {
    requested: number;
    approved?: number;
    spent?: number;
    category?: string;
    description?: string;
    expenses: Array<{
      category: string;
      amount: number;
      description: string;
      receipt?: string;
    }>;
  };
  resources: Array<{
    resourceId: string;
    resourceName: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  adminReview?: {
    reviewedBy: string;
    reviewedAt: Date;
    notes?: string;
    status: 'approved' | 'rejected' | 'changes-requested';
  };
  isJointEvent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'],
      required: true,
    },
    organizerId: {
      type: String,
      required: true,
      ref: 'User',
    },
    organizerName: {
      type: String,
      required: true,
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
        contribution: {
          type: String,
        },
      },
    ],
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: false,
      default: '12:00 PM',
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    venue: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
    },
    rulebookUrl: {
      type: String,
    },
    formLink: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'completed', 'changes-requested', 'live'],
      default: 'draft',
    },
    budget: {
      requested: {
        type: Number,
        default: 0,
      },
      approved: {
        type: Number,
      },
      spent: {
        type: Number,
        default: 0,
      },
      category: {
        type: String,
      },
      description: {
        type: String,
      },
      expenses: [
        {
          category: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          description: {
            type: String,
          },
          receipt: {
            type: String,
          },
        },
      ],
    },
    resources: [
      {
        resourceId: {
          type: String,
          required: true,
        },
        resourceName: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    adminReview: {
      reviewedBy: {
        type: String,
        ref: 'User',
      },
      reviewedAt: {
        type: Date,
      },
      notes: {
        type: String,
      },
      status: {
        type: String,
        enum: ['approved', 'rejected', 'changes-requested'],
      },
    },
    isJointEvent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ 'clubs.clubId': 1 });
eventSchema.index({ category: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
