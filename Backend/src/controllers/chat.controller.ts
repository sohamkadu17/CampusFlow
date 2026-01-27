import { Response } from 'express';
import { ChatRoom } from '../models/ChatRoom.model';
import { ChatMessage } from '../models/ChatMessage.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { emitToChatRoom } from '../config/socket';

export const getChatRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user!._id,
    }).sort({ 'lastMessage.timestamp': -1 });

    res.status(200).json({
      success: true,
      data: { rooms },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get chat rooms',
    });
  }
};

export const createChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, participants, eventId, clubId } = req.body;

    if (!name || !type || !participants || participants.length === 0) {
      throw new AppError('Please provide name, type, and participants', 400);
    }

    // Add creator to participants if not already included
    if (!participants.includes(req.user!._id)) {
      participants.push(req.user!._id);
    }

    const room = await ChatRoom.create({
      name,
      type,
      participants,
      eventId,
      clubId,
      createdBy: req.user!._id,
    });

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: { room },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create chat room',
    });
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new AppError('Chat room not found', 404);
    }

    if (!room.participants.includes(req.user!._id.toString())) {
      throw new AppError('Not authorized to access this chat room', 403);
    }

    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ChatMessage.countDocuments({ roomId });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get messages',
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { text, attachments } = req.body;

    if (!text) {
      throw new AppError('Please provide message text', 400);
    }

    // Verify user is participant
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new AppError('Chat room not found', 404);
    }

    if (!room.participants.includes(req.user!._id.toString())) {
      throw new AppError('Not authorized to send messages in this chat room', 403);
    }

    // Create message
    const message = await ChatMessage.create({
      roomId,
      senderId: req.user!._id.toString(),
      senderName: req.user!.name,
      senderAvatar: req.user!.profilePicture,
      text,
      attachments: attachments || [],
      readBy: [req.user!._id],
    });

    // Update room's last message
    room.lastMessage = {
      text,
      senderId: req.user!._id.toString(),
      timestamp: new Date(),
    };
    await room.save();

    // Emit message to room via Socket.IO
    const io = req.app.get('io');
    if (io) {
      emitToChatRoom(io, roomId, 'chat:message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    // Verify user is participant
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new AppError('Chat room not found', 404);
    }

    if (!room.participants.includes(req.user!._id.toString())) {
      throw new AppError('Not authorized', 403);
    }

    // Mark all messages in room as read by this user
    await ChatMessage.updateMany(
      {
        roomId,
        readBy: { $ne: req.user!._id },
      },
      {
        $addToSet: { readBy: req.user!._id },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read',
    });
  }
};
