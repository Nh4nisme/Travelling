# AI Chat Integration - Travelling App

## 📋 Tổng quan

Tích hợp bong bóng chat AI sử dụng **Google Gemini API** để hỗ trợ người dùng với:
- ✈️ Tìm kiếm và tư vấn về tours/listings
- 📅 Câu hỏi về booking (đặt chỗ, check-in, check-out)
- 💳 Thanh toán và chính sách hủy
- ❓ FAQ và hỗ trợ chung

## 🚀 Cài đặt

### 1. Cài đặt dependencies (đã hoàn thành)

```bash
pnpm add @google/generative-ai react-native-svg
```

### 2. Lấy Gemini API Key

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng Google account
3. Click **"Create API Key"**
4. Copy API key

### 3. Cấu hình Environment

Tạo file `.env` (nếu chưa có) và thêm:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

**Lưu ý:** Sử dụng prefix `EXPO_PUBLIC_` để biến được expose cho client-side trong React Native/Expo.

### 4. Restart Development Server

```bash
pnpm start --clear
```

## 📁 Cấu trúc Files

### Files đã tạo:

```
src/
├── components/
│   └── AIChatBubble.tsx          # UI Component - Bong bóng chat
├── services/
│   └── aiService.ts               # AI Service - Xử lý Gemini API
└── app/navigation/
    └── RootNavigator.tsx          # Đã tích hợp AIChatBubble
```

## 🎯 Cách sử dụng

### Tự động hiển thị

Bong bóng chat AI sẽ **tự động hiển thị** trên tất cả màn hình của app (trừ Splash và Auth).

### Tùy chỉnh vị trí (nếu cần)

Trong `RootNavigator.tsx`, bạn có thể thay đổi vị trí:

```tsx
{/* Vị trí bottom-right (mặc định) */}
<AIChatBubble />

{/* Vị trí bottom-left */}
<AIChatBubble position="bottom-left" />

{/* Tùy chỉnh khoảng cách */}
<AIChatBubble bottom={30} side={30} />
```

## 💡 Tính năng

### 1. Context-Aware AI

AI có thể truy cập:
- **Tất cả listings** (tours/accommodations) từ database
- **Bookings của user** (nếu đã đăng nhập)
- **FAQ data** từ helpContent.ts
- **Support contact** information

### 2. Hỏi đáp thông minh

AI có thể trả lời:

**Về Tours:**
```
"Tìm giúp tôi tour ở Đà Nẵng giá dưới $100"
"Beach resorts có rating cao nhất là gì?"
"So sánh giá giữa Mountain và Beach category"
```

**Về Booking:**
```
"Làm sao để đặt chỗ?"
"Tôi có thể thay đổi ngày check-in không?"
"Booking reference của tôi là gì?"
```

**Về Thanh toán:**
```
"Các phương thức thanh toán nào được hỗ trợ?"
"Service fee là bao nhiêu?"
"Tôi có thể trả góp không?"
```

**Về Hủy:**
```
"Chính sách hủy là gì?"
"Tôi có được hoàn tiền không?"
"Làm sao để hủy booking?"
```

### 3. UI/UX Features

- ✨ Smooth animations (scale, fade)
- 💬 Bubble chat tối giản
- 📱 Responsive design
- ⌨️ Keyboard-aware
- 🔄 Clear chat history
- ⚠️ Error handling với thông báo rõ ràng
- 🎨 Modern UI với shadow effects

## 🔧 Xử lý lỗi

### Lỗi thường gặp:

**1. "AI chat is not configured"**
- Nguyên nhân: Chưa set `EXPO_PUBLIC_GEMINI_API_KEY`
- Giải pháp: Thêm API key vào `.env` và restart server

**2. "Invalid Gemini API key"**
- Nguyên nhân: API key sai hoặc hết hạn
- Giải pháp: Kiểm tra lại API key từ Google AI Studio

**3. "API quota exceeded"**
- Nguyên nhân: Vượt giới hạn free tier
- Giải pháp: Đợi reset quota hoặc upgrade plan

**4. "Network error"**
- Nguyên nhân: Không có internet
- Giải pháp: Kiểm tra kết nối mạng

## 📊 Context Data Flow

```
User Question
    ↓
AIChatBubble Component
    ↓
aiService.chat()
    ↓
Build Context (listings + bookings + FAQs)
    ↓
Gemini API (with history)
    ↓
AI Response
    ↓
Display in Chat
```

## 🎨 Customization

### Thay đổi màu sắc

Trong `AIChatBubble.tsx`:

```tsx
// Màu bubble button
backgroundColor: '#007AFF',  // Đổi màu chính

// Màu tin nhắn user
messageBubbleUser: {
  backgroundColor: '#007AFF',
}

// Màu tin nhắn AI
messageBubbleAssistant: {
  backgroundColor: '#fff',
}
```

### Thay đổi model Gemini

Trong `aiService.ts`:

```tsx
// Sử dụng model khác
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro'  // Pro version (chậm hơn, thông minh hơn)
});

// Hoặc
model: 'gemini-1.5-flash'  // Flash version (nhanh, miễn phí)
```

### Thêm context mới

Trong `aiService.ts`, function `buildContext()`:

```tsx
// Thêm thông tin mới vào context
context += `\nADDITIONAL_INFO:
Your custom data here
`;
```

## 🔒 Security Notes

1. **API Key**: Không commit file `.env` lên git
2. **Client-side**: Gemini API được gọi từ client (đủ cho demo/MVP)
3. **Production**: Nên proxy qua backend để bảo vệ API key

### Backend Proxy (khuyến nghị cho production):

```typescript
// server/routes/ai.ts
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, history } = req.body;
  const response = await geminiAPI.chat(message, history);
  res.json({ response });
});
```

## 📈 Performance Tips

1. **Lazy Load**: AI chỉ load context khi user mở chat lần đầu
2. **Caching**: Chat history được lưu trong state (session only)
3. **Debounce**: Không áp dụng, user phải bấm Send
4. **Rate Limiting**: Gemini free tier: 60 requests/minute

## 🧪 Testing

### Test thủ công:

1. Khởi động app: `pnpm start`
2. Click vào bubble chat (góc dưới phải)
3. Thử các câu hỏi mẫu:
   - "Có những tour nào?"
   - "Làm sao để đặt chỗ?"
   - "Chính sách hủy là gì?"
   - "Show me beach resorts"

### Kiểm tra context:

```tsx
// Trong aiService.ts, thêm log:
console.log('Context:', systemContext);
```

## 📝 TODO / Improvements

- [ ] Multi-language support (EN/VI)
- [ ] Voice input
- [ ] Suggested questions (quick replies)
- [ ] Save chat history to storage
- [ ] Backend proxy cho API security
- [ ] Analytics tracking
- [ ] A/B testing different prompts
- [ ] Rich media responses (images, cards)
- [ ] Integration với booking flow
- [ ] Auto-suggest listings/bookings

## 🆘 Support

Nếu gặp vấn đề:
1. Check console logs (`console.log`, `console.error`)
2. Verify `.env` file đã có `EXPO_PUBLIC_GEMINI_API_KEY`
3. Restart dev server với `--clear` flag
4. Check network requests trong debug tools

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [React Native Expo Docs](https://docs.expo.dev/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Best Practices for Prompts](https://ai.google.dev/docs/prompt_best_practices)

---

**Tạo bởi:** AI Assistant
**Ngày:** 2026-11-17
**Version:** 1.0.0
