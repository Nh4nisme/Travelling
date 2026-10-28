export type ConversationStatus = 'all' | 'inquiry' | 'confirmed' | 'past' | 'support';

export interface ChatMessage {
  id: string;
  sender: 'host' | 'renter';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  hostName: string;
  hostAvatar: number; // seed for avatar(seed)
  role: string; // 'Host' | 'Superhost' | 'Support'
  status: 'inquiry' | 'confirmed' | 'past' | 'support';
  statusLabel: string; // 'Inquiry' | 'Reservation' | 'Past stay' | 'Support'
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  listingPrice?: number;
  dates?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: ChatMessage[];
}
