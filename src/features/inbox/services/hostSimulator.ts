import type { Conversation, ChatMessage } from '../types';

export function formatCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

export function generateHostResponse(conv: Conversation, userText: string): string {
  const lower = userText.toLowerCase().trim();

  // Support conversation
  if (conv.status === 'support' || conv.role === 'Support Team') {
    if (lower.includes('cancel') || lower.includes('refund') || lower.includes('hủy')) {
      return 'Travelling Support: We can assist with cancellation requests according to our Flexible Policy. Would you like us to review your booking details?';
    }
    if (lower.includes('pay') || lower.includes('payment') || lower.includes('tiền')) {
      return 'Travelling Support: All payments on Travelling are encrypted and secure. You can download official receipts under Profile > Payments.';
    }
    return `Travelling Support: Thank you for contacting us. An agent is reviewing your message and will follow up shortly!`;
  }

  // Pre-booking inquiry or confirmed reservation
  if (lower.includes('check-in') || lower.includes('checkin') || lower.includes('giờ nhận') || lower.includes('time')) {
    return 'Standard check-in is at 14:00. You are warmly welcome to drop off your luggage early from 11:00 AM at our reception lounge!';
  }

  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('mật khẩu') || lower.includes('pass')) {
    return 'We have high-speed optical fiber wifi (150 Mbps). Network: Travelling_Guest, Password: welcome2026. Perfect for remote work!';
  }

  if (lower.includes('park') || lower.includes('xe') || lower.includes('garage')) {
    return 'Yes, free private parking space is available right in front of the premises with 24/7 security surveillance.';
  }

  if (lower.includes('pet') || lower.includes('thú cưng') || lower.includes('chó') || lower.includes('mèo')) {
    return 'Pets under 10kg are very welcome! We just kindly request keeping them off the beds and maintaining clean shared spaces.';
  }

  if (lower.includes('kitchen') || lower.includes('bếp') || lower.includes('nấu')) {
    return 'The kitchen is fully equipped with an induction stove, microwave, refrigerator, cookware, and complementary coffee & tea.';
  }

  if (lower.includes('discount') || lower.includes('giảm giá') || lower.includes('deal')) {
    return 'Our listed price already includes seasonal discounts! For stays longer than 5 nights, we automatically apply an additional 10% discount.';
  }

  // General friendly response
  return `Thank you for reaching out! I've noted your message and will make sure everything is ready and comfortable for you.`;
}

export function generateGuestResponse(conv: Conversation, hostText: string): string {
  const lower = hostText.toLowerCase().trim();

  if (lower.includes('14:00') || lower.includes('check-in') || lower.includes('checkin')) {
    return 'Cảm ơn bạn! Mình đã lưu thông tin giờ nhận phòng và sẽ đến đúng hẹn.';
  }

  if (lower.includes('wifi') || lower.includes('pass') || lower.includes('mật khẩu')) {
    return 'Tuyệt quá, cảm ơn bạn đã gửi thông tin wifi. Mình rất cần mạng ổn định để làm việc.';
  }

  if (lower.includes('welcome') || lower.includes('chào')) {
    return 'Dạ cảm ơn bạn nhiều nhé! Rất háo hức được trải nghiệm kỳ nghỉ tại đây.';
  }

  return 'Cảm ơn bạn đã phản hồi nhanh chóng! Nếu có thêm câu hỏi mình sẽ nhắn lại bạn ngay.';
}

export function generatePartnerResponse(conv: Conversation, userText: string, isHostUser: boolean): string {
  if (isHostUser) {
    return generateGuestResponse(conv, userText);
  }
  return generateHostResponse(conv, userText);
}
