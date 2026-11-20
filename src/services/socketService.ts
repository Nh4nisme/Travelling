import { io, Socket } from 'socket.io-client';
import { ENV } from '@/config/env';

let socket: Socket | null = null;
let currentConversationId: string | null = null;
let lastWarnTime = 0;

export const socketService = {
  // Kết nối đến server socket
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
  // Tham gia phòng chat
  joinConversation(conversationId: string) {
    if (!conversationId) return;
    currentConversationId = conversationId;
    const s = this.connect();
    if (s.connected) {
      s.emit('join_conversation', conversationId);
    }
  },
  // Rời khỏi phòng chat
  leaveConversation(conversationId: string) {
    if (!conversationId) return;
    if (currentConversationId === conversationId) {
      currentConversationId = null;
    }
    if (socket && socket.connected) {
      socket.emit('leave_conversation', conversationId);
    }
  },
  // Gửi sự kiện bắt đầu gõ tin nhắn
  emitTypingStart(conversationId: string, userId: string, userName: string) {
    if (!conversationId) return;
    const s = this.connect();
    if (s.connected) {
      s.emit('typing:start', { conversationId, userId, userName });
    }
  },
  // Gửi sự kiện dừng gõ tin nhắn
  emitTypingStop(conversationId: string, userId: string) {
    if (!conversationId) return;
    const s = this.connect();
    if (s.connected) {
      s.emit('typing:stop', { conversationId, userId });
    }
  },
};
