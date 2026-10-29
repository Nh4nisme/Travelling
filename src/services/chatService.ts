import { api } from './api';
import { tokenStorage } from './tokenStorage';
import type { Conversation, ChatMessage } from '@/features/inbox/types';

export const chatService = {
  async getConversations(overrideToken?: string | null): Promise<Conversation[]> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) return [];
    const res = await api<{ conversations: Conversation[] }>('/chat/conversations', { token });
    return res.conversations;
  },

  async getMessages(conversationId: string, overrideToken?: string | null): Promise<ChatMessage[]> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) return [];
    const res = await api<{ messages: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`, {
      token,
    });
    return res.messages;
  },

  async sendMessage(
    conversationId: string,
    text: string,
    image?: string,
    overrideToken?: string | null
  ): Promise<ChatMessage> {
    const token = overrideToken ?? (await tokenStorage.get());
    const res = await api<{ message: ChatMessage }>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text, image },
      token,
    });
    return res.message;
  },

  async createInquiry(
    payload: {
      hostId: string;
      listingId?: string;
      listingTitle?: string;
      listingImage?: string;
      listingPrice?: number;
    },
    overrideToken?: string | null
  ): Promise<string> {
    const token = overrideToken ?? (await tokenStorage.get());
    const res = await api<{ conversationId: string }>('/chat/inquire', {
      method: 'POST',
      body: payload,
      token,
    });
    return res.conversationId;
  },
};
