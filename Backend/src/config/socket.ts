import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User.model';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

export const initializeSocketIO = (io: Server): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.user = { _id: decoded.userId } as unknown as IUser;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.user?._id}`);
    
    // Join user's personal room
    if (socket.user?._id) {
      socket.join(`user:${socket.user._id}`);
    }

    // Join chat room
    socket.on('join:room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`User ${socket.user?._id} joined room: ${roomId}`);
    });

    // Leave chat room
    socket.on('leave:room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.user?._id} left room: ${roomId}`);
    });

    // Handle chat messages
    socket.on('chat:message', (data: { roomId: string; message: string }) => {
      io.to(`room:${data.roomId}`).emit('chat:message', {
        userId: socket.user?._id,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Typing indicators
    socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(`room:${data.roomId}`).emit('chat:typing', {
        userId: socket.user?._id,
        isTyping: data.isTyping,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user?._id}`);
    });
  });

  console.log('🔌 Socket.IO initialized');
};

// Helper function to emit notifications to specific user
export const emitNotification = (io: Server, userId: string, notification: any): void => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Helper function to emit to a chat room
export const emitToChatRoom = (io: Server, roomId: string, event: string, data: any): void => {
  io.to(`room:${roomId}`).emit(event, data);
};
