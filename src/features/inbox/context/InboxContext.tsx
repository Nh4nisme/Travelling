import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Conversation, ChatMessage } from '../types';
import { RENTER_CONVERSATIONS } from '../mockData';
import { chatService } from '@/services/chatService';
import { tokenStorage } from '@/services/tokenStorage';
import { socketService } from '@/services/socketService';
import { useApp } from '@/store/AppContext';

export interface InboxContextType {
  conversations: Conversation[];
  loading: boolean;
  unreadCount: number;
  typingMap: Record<string, boolean>;
  isHostUser: boolean;
  refreshConversations: () => Promise<void>;
  getConversation: (id: string) => Conversation | undefined;
  fetchMessages: (convId: string) => Promise<ChatMessage[]>;
  sendMessage: (convId: string, text: string, image?: string) => Promise<void>;
  markAsRead: (convId: string) => void;
  createInquiry: (listing: {
    id: string;
    title: string;
    image: string;
    price: number;
    hostName?: string;
  }) => Promise<string>;
}

export const InboxContext = createContext<InboxContextType | null>(null);

export function useInbox() {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

  // 1. Tải danh sách hội thoại THỰC TẾ từ Database MongoDB Atlas
  const refreshConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await tokenStorage.get();
      if (!token) {
        setConversations(RENTER_CONVERSATIONS);
        return;
      }
      const data = await chatService.getConversations(token);
      if (data && data.length > 0) {
        setConversations(data);
      } else {
        setConversations(RENTER_CONVERSATIONS);
      }
    } catch {
      setConversations(RENTER_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [user?.id, refreshConversations]);

  // 2. KẾT NỐI REALTIME SOCKET.IO - LẮNG NGHE SỰ KIỆN TỨC THÌ
  useEffect(() => {
    const socket = socketService.connect();

    // A. Nhận tin nhắn mới tức thì từ Socket.io (<50ms)
    const handleNewMessage = (newMsg: ChatMessage & { conversationId: string }) => {
      if (!newMsg?.conversationId) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const existing = c.messages || [];

            // Tránh duplicate nếu tin nhắn đã có
            if (existing.some((m) => m.id === newMsg.id)) {
              return c;
            }

            // Nếu người gửi chính là mình và đang có tempMsg
            const tempIndex = existing.findIndex(
              (m) => m.id.startsWith('temp-') && m.text === newMsg.text
            );

            if (tempIndex !== -1) {
              const updated = [...existing];
              updated[tempIndex] = newMsg;
              return {
                ...c,
                lastMessage: newMsg.text || 'Photo attachment',
                lastMessageTime: newMsg.time || 'Just now',
                messages: updated,
              };
            }

            // Tin nhắn từ đối phương (Bên B nhận từ Bên A) -> Tự động thêm vào hội thoại!
            return {
              ...c,
              lastMessage: newMsg.text || 'Photo attachment',
              lastMessageTime: newMsg.time || 'Just now',
              messages: [...existing, newMsg],
            };
          }
          return c;
        })
      );
    };

    // B. Cập nhật preview tin nhắn cuối trong danh sách Inbox
    const handleConversationUpdated = (data: {
      id: string;
      lastMessage: string;
      lastMessageTime: string;
      unreadFor?: string;
    }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === data.id) {
            const isUnreadForMe = Boolean(user?.id && data.unreadFor === user.id);
            return {
              ...c,
              lastMessage: data.lastMessage,
              lastMessageTime: data.lastMessageTime,
              unread: isUnreadForMe ? true : c.unread,
            };
          }
          return c;
        })
      );
    };

    // C. Lắng nghe trạng thái đang gõ phím từ đối phương
    const handleTypingStart = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (userId !== user?.id) {
        setTypingMap((prev) => ({ ...prev, [conversationId]: true }));
      }
    };

    const handleTypingStop = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (userId !== user?.id) {
        setTypingMap((prev) => ({ ...prev, [conversationId]: false }));
      }
    };

    socket.on('message:received', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:received', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [user?.id]);

  // 3. Xác định vai trò từ dữ liệu cuộc hội thoại của database
  const isHostUser = useMemo(() => {
    if (conversations.length > 0) {
      return Boolean(conversations[0]?.isHostView);
    }
    return Boolean(user && user.email === 'jinny@gmail.com');
  }, [conversations, user]);

  // 4. Đánh dấu đã đọc
  const markAsRead = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: false } : c))
    );
  }, []);

  // 5. Lấy chi tiết 1 hội thoại từ memory
  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations]
  );

  // 6. Tải tin nhắn từ Database MongoDB cho 1 hội thoại cụ thể
  const fetchMessages = useCallback(
    async (convId: string): Promise<ChatMessage[]> => {
      try {
        const token = await tokenStorage.get();
        if (!token) return [];
        const msgs = await chatService.getMessages(convId, token);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, messages: msgs } : c))
        );
        return msgs;
      } catch {
        return [];
      }
    },
    []
  );

  // 7. Gửi tin nhắn thực tế LƯU VÀO DATABASE MONGODB ATLAS + REALTIME SOCKET
  const sendMessage = useCallback(
    async (convId: string, text: string, image?: string) => {
      if (!text.trim() && !image) return;

      const trimmedText = text.trim();
      const token = await tokenStorage.get();

      // Optimistic update UI ngay lập tức
      const tempId = `temp-${Date.now()}`;
      const tempMsg: ChatMessage = {
        id: tempId,
        sender: isHostUser ? 'host' : 'renter',
        text: trimmedText,
        time: 'Just now',
        timestamp: Date.now(),
        image,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              lastMessage: trimmedText || '📷 Photo attachment',
              lastMessageTime: 'Just now',
              messages: [...(c.messages || []), tempMsg],
            };
          }
          return c;
        })
      );

      // Gửi vào MongoDB Atlas qua API -> Server sẽ tự động bắn Socket cho đối phương
      try {
        if (token) {
          const savedMsg = await chatService.sendMessage(convId, trimmedText, image, token);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: (c.messages || []).map((m) => (m.id === tempId ? savedMsg : m)),
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.error('Không thể lưu tin nhắn vào MongoDB:', err);
      }
    },
    [isHostUser]
  );

  // 8. Tạo cuộc trò chuyện mới trên Database
  const createInquiry = useCallback(
    async (listing: {
      id: string;
      title: string;
      image: string;
      price: number;
      hostName?: string;
    }): Promise<string> => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          const convId = await chatService.createInquiry(
            {
              hostId: '6ae2ea544bc06f0a8736c77f',
              listingId: listing.id,
              listingTitle: listing.title,
              listingImage: listing.image,
              listingPrice: listing.price,
            },
            token
          );
          await refreshConversations();
          return convId;
        }
      } catch (e) {
        console.error('Lỗi tạo inquiry trên MongoDB:', e);
      }
      return 'conv-1';
    },
    [refreshConversations]
  );

  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <InboxContext.Provider
      value={{
        conversations,
        loading,
        unreadCount,
        typingMap,
        isHostUser,
        refreshConversations,
        getConversation,
        fetchMessages,
        sendMessage,
        markAsRead,
        createInquiry,
      }}
    >
      {children}
    </InboxContext.Provider>
  );
}
