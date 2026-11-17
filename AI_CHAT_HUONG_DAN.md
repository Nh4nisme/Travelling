# 🤖 Hướng dẫn sử dụng AI Chat - Travelling App

## ⚡ Cài đặt nhanh (5 phút)

### Bước 1: Lấy API Key từ Google
1. Mở: https://makersuite.google.com/app/apikey
2. Đăng nhập Google
3. Click **"Create API Key"**
4. Copy key vừa tạo

### Bước 2: Thêm vào file .env
```bash
# Tạo file .env (nếu chưa có)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your-key-here
```

### Bước 3: Chạy app
```bash
pnpm start --clear
```

**Xong!** Bong bóng chat AI sẽ xuất hiện ở góc dưới bên phải màn hình.

## 💬 Thử nghiệm

Hỏi AI những câu như:
- "Có những tour nào ở Việt Nam?"
- "Tour nào có giá dưới $100?"
- "Làm sao để đặt chỗ?"
- "Chính sách hủy booking thế nào?"
- "Tôi có thể thanh toán thế nào?"

## 🎯 AI có thể làm gì?

✅ **Tư vấn về Tours/Listings**
- Tìm kiếm theo địa điểm, giá, loại hình
- So sánh các tour
- Giới thiệu tour phù hợp

✅ **Hỗ trợ Booking**
- Hướng dẫn đặt chỗ
- Thay đổi ngày, số khách
- Kiểm tra booking của bạn

✅ **Thanh toán & Hủy**
- Giải thích phương thức thanh toán
- Chính sách hủy và hoàn tiền
- Phí dịch vụ

✅ **FAQ tổng hợp**
- Câu hỏi thường gặp
- Liên hệ support
- Vấn đề tài khoản

## 🔧 Nếu gặp lỗi

**"AI chat is not configured"**
→ Chưa có API key trong file `.env`

**"Invalid API key"**
→ API key sai, lấy lại từ Google AI Studio

**"Network error"**
→ Kiểm tra kết nối internet

## 📍 Tùy chỉnh vị trí bubble

Trong file `src/app/navigation/RootNavigator.tsx`:

```tsx
{/* Góc dưới phải (mặc định) */}
<AIChatBubble />

{/* Góc dưới trái */}
<AIChatBubble position="bottom-left" />

{/* Tùy chỉnh khoảng cách */}
<AIChatBubble bottom={30} side={20} />
```

## 🎨 Tùy chỉnh giao diện

Mở file `src/components/AIChatBubble.tsx`:

```tsx
// Đổi màu bubble chính (line ~288)
backgroundColor: '#007AFF',  // Đổi sang màu bạn thích

// Đổi màu tin nhắn (line ~380+)
messageBubbleUser: {
  backgroundColor: '#007AFF',  // Màu tin nhắn của user
}
```

## 💡 Tips sử dụng

1. **Hỏi cụ thể**: "Beach resort ở Đà Nẵng giá $50-100" tốt hơn "Tour rẻ"
2. **Ngữ cảnh**: AI biết về listings, bookings của bạn, và FAQ
3. **Ngôn ngữ**: Hỏi tiếng Việt hoặc tiếng Anh đều được
4. **Clear chat**: Click icon refresh để xóa lịch sử chat

## 📊 Công nghệ

- **AI Model**: Google Gemini 1.5 Flash (miễn phí, nhanh)
- **Framework**: React Native + Expo
- **Animation**: React Native Animated
- **Context**: Listings + Bookings + FAQ data

## 🚀 Phát triển thêm

Có thể thêm:
- [ ] Đa ngôn ngữ (EN/VI tự động)
- [ ] Gợi ý câu hỏi nhanh
- [ ] Lưu lịch sử chat
- [ ] Voice input
- [ ] Gửi kèm hình ảnh tour
- [ ] Tích hợp trực tiếp vào booking flow

---

**Mọi thắc mắc xem thêm tại:** `AI_CHAT_README.md`
