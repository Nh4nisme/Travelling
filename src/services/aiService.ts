import { GoogleGenerativeAI } from '@google/generative-ai';
import { FAQS, SUPPORT_CONTACT } from '@/features/profile/data/helpContent';
import type { Listing } from '@/types/listing';
import type { Booking } from '@/store/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

/**
 * Tạo context từ dữ liệu dự án để AI có thể trả lời chính xác
 */
function buildContext(listings?: Listing[], bookings?: Booking[]): string {
  let context = `You are a helpful AI assistant for Travelling App - a travel booking platform.

SUPPORT CONTACT:
- Email: ${SUPPORT_CONTACT.email}
- Phone: ${SUPPORT_CONTACT.phoneDisplay}
- Hours: ${SUPPORT_CONTACT.hours}
- Response time: ${SUPPORT_CONTACT.responseTime}

FREQUENTLY ASKED QUESTIONS:
${FAQS.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

`;

  if (listings && listings.length > 0) {
    context += `\nAVAILABLE TOURS/LISTINGS (sample of ${listings.length} properties):
${listings.slice(0, 10).map(listing => 
  `- ${listing.title} in ${listing.city}, ${listing.country}
  Price: $${listing.price}/night, Rating: ${listing.rating}/5 (${listing.reviews} reviews)
  Type: ${listing.type}, Category: ${listing.category}
  Facilities: ${listing.facilities.join(', ')}
  Description: ${listing.desc.slice(0, 150)}...`
).join('\n\n')}
`;
  }

  if (bookings && bookings.length > 0) {
    context += `\nUSER'S BOOKINGS:
${bookings.map(booking => 
  `- Booking ${booking.ref}: ${booking.listing.title}
  Check-in: ${booking.checkIn}, Check-out: ${booking.checkOut}
  Status: ${booking.status}, Stage: ${booking.stage}
  Total: $${booking.price.total}, Paid: $${booking.payment.amountPaid}`
).join('\n\n')}
`;
  }

  context += `\n
GUIDELINES:
- Answer questions about tours, bookings, payments, cancellations, and account management
- Use the FAQ data above to provide accurate answers
- If asked about specific listings, reference the available tours data
- If asked about user's bookings, reference the user's bookings data
- Be helpful, friendly, and concise
- If you don't know something, suggest contacting support at ${SUPPORT_CONTACT.email}
- Always format prices in USD with $ symbol
- Use markdown formatting for better readability
`;

  return context;
}

export const aiService = {
  /**
   * Kiểm tra xem API key có được cấu hình chưa
   */
  isConfigured(): boolean {
    return !!GEMINI_API_KEY && !!genAI;
  },

  /**
   * Gửi tin nhắn đến AI và nhận phản hồi
   */
  async chat(
    message: string,
    history: AIMessage[] = [],
    context?: { listings?: Listing[]; bookings?: Booking[] }
  ): Promise<string> {
    if (!genAI) {
      throw new Error('Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Xây dựng context từ dữ liệu dự án
      const systemContext = buildContext(context?.listings, context?.bookings);

      // Chuyển đổi lịch sử chat sang định dạng Gemini
      const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Bắt đầu chat session với context
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemContext }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will help users with questions about the Travelling App, tours, bookings, and general support using the information provided.' }],
          },
          ...chatHistory,
        ],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Xử lý các lỗi phổ biến
      if (error?.message?.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      }
      if (error?.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  },

  /**
   * Tạo ID duy nhất cho tin nhắn
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  },

  /**
   * Tạo tin nhắn mới
   */
  createMessage(role: 'user' | 'assistant', content: string): AIMessage {
    return {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date(),
    };
  },
};
