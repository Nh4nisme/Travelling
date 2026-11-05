import { io, Socket } from 'socket.io-client';
import { ENV } from '@/config/env';

let socket: Socket | null = null;
let currentConversationId: string | null = null;
let lastWarnTime = 0;

export const socketService = {
  connect(): Socket {
    if (!socket) {
      // Ưu tiên polling trước để bắt tay 100% thành công trên mọi thiết bị và mạng LAN, sau đó tự động nâng cấp lên websocket
      socket = io(ENV.socketUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        // Tự động tham gia lại phòng chat nếu đang mở màn hình hội thoại
        if (currentConversationId && socket?.connected) {
          socket.emit('join_conversation', currentConversationId);
        }
      });

      socket.on('connect_error', () => {
        // Tránh in log liên tục gây spam màn hình Metro terminal
        const now = Date.now();
        if (now - lastWarnTime > 30000) {
          lastWarnTime = now;
        }
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
    currentConversationId = conversationId;
    const s = this.connect();
    if (s.connected) {
      s.emit('join_conversation', conversationId);
    }
  },

  leaveConversation(conversationId: string) {
    if (!conversationId) return;
    if (currentConversationId === conversationId) {
      currentConversationId = null;
    }
    if (socket && socket.connected) {
      socket.emit('leave_conversation', conversationId);
    }
  },

  emitTypingStart(conversationId: string, userId: string, userName: string) {
    if (!conversationId) return;
    const s = this.connect();
    if (s.connected) {
      s.emit('typing:start', { conversationId, userId, userName });
    }
  },

  emitTypingStop(conversationId: string, userId: string) {
    if (!conversationId) return;
    const s = this.connect();
    if (s.connected) {
      s.emit('typing:stop', { conversationId, userId });
    }
  },
};
