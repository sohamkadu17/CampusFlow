import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Search, Plus, MoreVertical, ArrowLeft,
  User, Users, Hash, Clock, Check, CheckCheck, Loader2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = (import.meta as any).env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface ChatInterfaceProps {
  onBack: () => void;
}

interface ChatRoom {
  _id: string;
  name: string;
  type: 'direct' | 'group' | 'event' | 'club';
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount?: number;
  eventId?: string;
  clubId?: string;
}

interface Message {
  _id: string;
  roomId: string;
  senderId: {
    _id: string;
    name: string;
  };
  content: string;
  type: 'text' | 'system';
  createdAt: Date;
  isRead: boolean;
}

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [createRoomForm, setCreateRoomForm] = useState({ name: '', type: 'group' as 'direct' | 'group' });
  const [creatingRoom, setCreatingRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id;
  const isOrganizer = currentUser.role === 'organizer' || currentUser.role === 'admin';

  // Initialize Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new_message', (message: Message) => {
      console.log('Received new_message event:', message);
      if (selectedRoom && message.roomId === selectedRoom._id) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      // Update last message in room list
      setRooms((prev) =>
        prev.map((room) =>
          room._id === message.roomId
            ? {
                ...room,
                lastMessage: {
                  content: message.content,
                  timestamp: message.createdAt,
                  senderId: message.senderId._id,
                },
              }
            : room
        )
      );
    });

    newSocket.on('user_typing', ({ roomId, userId, userName }: any) => {
      if (selectedRoom && roomId === selectedRoom._id && userId !== currentUserId) {
        setTypingUsers((prev) => [...prev.filter((id) => id !== userId), userId]);
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }, 3000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [selectedRoom]);

  // Load chat rooms
  useEffect(() => {
    loadRooms();
  }, []);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      console.log('Room selected:', selectedRoom.name, selectedRoom._id);
      loadMessages(selectedRoom._id);
      if (socket) {
        console.log('Joining room via socket:', selectedRoom._id);
        socket.emit('join:room', selectedRoom._id);
      } else {
        console.warn('Socket not available when trying to join room');
      }
    }
    
    return () => {
      if (selectedRoom && socket) {
        console.log('Leaving room:', selectedRoom._id);
        socket.emit('leave:room', selectedRoom._id);
      }
    };
  }, [selectedRoom, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !socket) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasRoom: !!selectedRoom, 
        hasSocket: !!socket,
        socketConnected: socket?.connected 
      });
      return;
    }

    const messageContent = newMessage.trim();
    const messageData = {
      roomId: selectedRoom._id,
      content: messageContent,
      type: 'text',
    };

    console.log('Sending message:', messageData);

    try {
      setSending(true);
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        roomId: selectedRoom._id,
        senderId: {
          _id: currentUserId,
          name: currentUser.name || 'You'
        },
        content: messageContent,
        type: 'text',
        createdAt: new Date(),
        isRead: false
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Send via socket
      socket.emit('send_message', messageData);
      console.log('Message sent successfully');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && selectedRoom) {
      socket.emit('typing', { roomId: selectedRoom._id });
    }
  };

  const createRoom = async () => {
    if (!createRoomForm.name.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      setCreatingRoom(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/rooms`,
        {
          name: createRoomForm.name,
          type: createRoomForm.type,
          participants: [currentUserId],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRooms([response.data.data.room, ...rooms]);
      setShowCreateRoom(false);
      setCreateRoomForm({ name: '', type: 'group' });
      setSelectedRoom(response.data.data.room);
    } catch (err: any) {
      console.error('Failed to create room:', err);
      alert(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'direct':
        return <User className="w-5 h-5" />;
      case 'group':
        return <Users className="w-5 h-5" />;
      case 'event':
        return <Hash className="w-5 h-5" />;
      case 'club':
        return <Hash className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
            </div>
            {isOrganizer && (
              <button
                onClick={() => setShowCreateRoom(true)}
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center transition-colors"
                title="Create New Chat Room"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center p-8 text-slate-600 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 hover:bg-slate-50 transition-colors text-left ${
                    selectedRoom?._id === room._id ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRoom?._id === room._id ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getRoomIcon(room)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">{room.name}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.participants?.length || 0}
                          </span>
                        </div>
                        {room.lastMessage && (
                          <span className="text-xs text-slate-500">
                            {formatTime(room.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {room.lastMessage && (
                        <p className="text-sm text-slate-600 truncate">{room.lastMessage.content}</p>
                      )}
                    </div>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-medium">
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                    {getRoomIcon(selectedRoom)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedRoom.name}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="capitalize">{selectedRoom.type}</span>
                      <span>\u2022</span>
                      <span>{selectedRoom.participants.length} participant{selectedRoom.participants.length !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((message, index) => {
                const isOwnMessage = message.senderId._id === currentUserId;
                const showAvatar =
                  index === messages.length - 1 ||
                  messages[index + 1]?.senderId._id !== message.senderId._id;

                return (
                  <div
                    key={message._id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {showAvatar && !isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-violet-600" />
                      </div>
                    )}
                    {!showAvatar && !isOwnMessage && <div className="w-8" />}

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-md`}>
                      {!isOwnMessage && (
                        <span className="text-xs text-slate-600 mb-1 px-1">
                          {message.senderId.name}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-white text-slate-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-xs text-slate-500">
                          {new Date(message.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                        {isOwnMessage && (
                          message.isRead ? (
                            <CheckCheck className="w-3 h-3 text-violet-600" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Someone is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:bg-white"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a conversation</h3>
              <p className="text-slate-600">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && isOrganizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Create Discussion Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-slate-600 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Name</label>
                <input
                  type="text"
                  value={createRoomForm.name}
                  onChange={(e) => setCreateRoomForm({ ...createRoomForm, name: e.target.value })}
                  placeholder="e.g., Tech Club Chat, Event Planning"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                <select
                  value={createRoomForm.type}
                  onChange={(e) => setCreateRoomForm({ ...createRoomForm, type: e.target.value as 'direct' | 'group' })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <option value="group">Group Chat</option>
                  <option value="direct">Direct Message</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Note:</strong> Students can join and participate in all created discussion rooms. This room will be visible to all users.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={creatingRoom || !createRoomForm.name.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  {creatingRoom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Chat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
