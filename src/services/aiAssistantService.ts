import { GoogleGenerativeAI } from '@google/generative-ai';
import { FAQS, SUPPORT_CONTACT } from '@/features/profile/data/helpContent';
import type { Listing } from '@/types/listing';
import type { Booking } from '@/store/types';
import type { ChatMessage } from '@/features/inbox/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Danh sách models theo thứ tự ưu tiên (từ ổn định nhất đến mới nhất)
const MODEL_FALLBACKS = [
  'gemini-pro',                    // Legacy, most stable
  'gemini-flash-latest',           // Stable alias
  'gemini-pro-latest',             // Legacy pro
  'gemini-3.5-flash',              // Stable
  'gemini-3.6-flash',              // Older stable
  'gemini-3.7-flash',              // Newer
  'gemini-3.5-flash-lite',         // Fast lite
  'gemini-3.8-flash',              // Latest (may be overloaded)
];

let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

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
- Keep responses brief and conversational (like a chat message, not an essay)
- Use emojis occasionally to be friendly
`;

  return context;
}

/**
 * Chuyển đổi ChatMessage sang định dạng cho Gemini
 */
function convertMessagesToHistory(messages: ChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  return messages.map(msg => ({
    role: msg.sender === 'renter' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));
}

export const aiAssistantService = {
  /**
   * Kiểm tra xem API key có được cấu hình chưa
   */
  isConfigured(): boolean {
    return !!GEMINI_API_KEY && !!genAI;
  },

  /**
   * Chat với AI Assistant với fallback mechanism
   */
  async chat(
    message: string,
    history: ChatMessage[] = [],
    context?: { listings?: Listing[]; bookings?: Booking[] }
  ): Promise<string> {
    if (!genAI) {
      return `Sorry, AI Assistant is not configured. Please contact support at ${SUPPORT_CONTACT.email} for help! 😊`;
    }

    // Xây dựng context từ dữ liệu dự án
    const systemContext = buildContext(context?.listings, context?.bookings);

    // Chuyển đổi lịch sử chat
    const chatHistory = convertMessagesToHistory(history);

    // Thử từng model cho đến khi thành công
    let lastError: any = null;
    
    for (const modelName of MODEL_FALLBACKS) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

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
        
        console.log(`✅ Success with model: ${modelName}`);
        return response.text();
        
      } catch (error: any) {
        console.warn(`❌ Model ${modelName} failed:`, error.message);
        lastError = error;
        
        // Nếu là 503 (overload), thử model tiếp theo
        if (error?.message?.includes('503') || error?.message?.includes('high demand')) {
          continue;
        }
        
        // Nếu là 404 (not found), thử model tiếp theo
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          continue;
        }
        
        // Nếu là lỗi khác (API key, quota, network), không thử nữa
        break;
      }
    }

    // Tất cả models đều fail
    console.error('All models failed. Last error:', lastError);
    
    // Xử lý các lỗi phổ biến
    if (lastError?.message?.includes('API_KEY')) {
      return 'Sorry, there seems to be an issue with my configuration. Please contact support! 😅';
    }
    if (lastError?.message?.includes('quota')) {
      return 'I\'m getting too many requests right now. Please try again in a few minutes or contact support! 🙏';
    }
    if (lastError?.message?.includes('503') || lastError?.message?.includes('high demand')) {
      return `All AI models are currently experiencing high demand. This usually happens during peak hours. Please try again in a few minutes! 🕐\n\nOr contact support at ${SUPPORT_CONTACT.email} for immediate help.`;
    }
    if (lastError?.message?.includes('network') || lastError?.message?.includes('fetch')) {
      return 'I\'m having trouble connecting. Please check your internet connection and try again! 📶';
    }
    
    return 'Sorry, I encountered an error. Please try again or contact support for help! 😊';
  },

  /**
   * Tin nhắn chào mừng
   */
  getWelcomeMessage(): string {
    return `Hello! 👋 I'm your AI travel assistant.

I can help you with:
• Finding tours and accommodations 🏖️
• Booking questions 📅
• Payment and cancellation policies 💳
• General FAQs ❓

How can I help you today?`;
  },
};
