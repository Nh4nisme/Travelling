import { io, Socket } from 'socket.io-client';
import { ENV } from '@/config/env';

let socket: Socket | null = null;

export const socketService = {
  connect(): Socket {
    if (!socket) {
      socket = io(ENV.socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('⚡ Socket connected to server:', socket?.id);
      });

      socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection warning:', error.message);
      });
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  joinConversation(conversationId: string) {
    if (!conversationId) return;
    const s = this.connect();
    s.emit('join_conversation', conversationId);
  },

  leaveConversation(conversationId: string) {
    if (!conversationId) return;
    if (socket && socket.connected) {
      socket.emit('leave_conversation', conversationId);
    }
  },

  emitTypingStart(conversationId: string, userId: string, userName: string) {
    if (!conversationId) return;
    const s = this.connect();
    s.emit('typing:start', { conversationId, userId, userName });
  },

  emitTypingStop(conversationId: string, userId: string) {
    if (!conversationId) return;
    const s = this.connect();
    s.emit('typing:stop', { conversationId, userId });
  },
};
