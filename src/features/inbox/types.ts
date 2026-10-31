export type ConversationStatus = 'all' | 'inquiry' | 'confirmed' | 'past' | 'support';

export interface ChatMessage {
  id: string;
  conversationId?: string;
  sender: 'host' | 'renter';
  senderName?: string;
  text: string;
  time: string;
  timestamp?: number;
  image?: string;
}

export interface Conversation {
  id: string;
  hostName: string;
  hostAvatar: number; // seed for avatar(seed)
  role: string; // 'Host' | 'Superhost' | 'Verified Guest' | 'Support Team'
  status: 'inquiry' | 'confirmed' | 'past' | 'support';
  statusLabel: string; // 'Inquiry' | 'Reserved · May 1 - 6' | 'Past stay' | 'Official Support'
  isHostView?: boolean;
  partnerEmail?: string;
  partnerPhone?: string;
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  listingPrice?: number;
  dates?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages?: ChatMessage[];
  isTyping?: boolean;
}
