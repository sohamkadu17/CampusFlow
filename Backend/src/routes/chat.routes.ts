import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getChatRooms,
  createChatRoom,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
} from '../controllers/chat.controller';

const router = Router();

router.use(protect);

router.get('/rooms', getChatRooms);
router.post('/rooms', createChatRoom);
router.get('/rooms/:roomId/messages', getChatMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.put('/rooms/:roomId/read', markMessagesAsRead);

export default router;
