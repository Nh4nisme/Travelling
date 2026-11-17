# 🔧 AI Assistant - Troubleshooting Guide

## ❌ Lỗi phổ biến và cách sửa

### 1. Error 404: Model not found

**Lỗi:**
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [404 not found]
```

**Nguyên nhân:**
- Model name không đúng format cho API v1beta

**✅ Đã sửa:**
- Đổi sang `gemini-3.8-flash` (model mới nhất, được recommend bởi Google)
- File: `src/services/aiAssistantService.ts`

**Các model name khả dụng từ API của bạn:**
- ✅ `gemini-3.8-flash` (Recommended - mới nhất, latest features)
- ✅ `gemini-3.7-flash` (Stable version)
- ✅ `gemini-3.6-flash` (Older stable)
- ✅ `gemini-3.5-flash` (Production ready)
- ⚠️ `gemini-2.5-flash` (Deprecated - không còn khả dụng cho user mới)

---

### 2. Error: API key invalid

**Lỗi:**
```
Invalid API key. Please check your configuration.
```

**Nguyên nhân:**
- API key sai hoặc không có trong `.env`

**Cách sửa:**
1. Kiểm tra file `.env`:
   ```bash
   EXPO_PUBLIC_GEMINI_API_KEY=AIza...your-key-here
   ```

2. Lấy API key mới:
   - Truy cập: https://makersuite.google.com/app/apikey
   - Đăng nhập Google
   - Click "Create API Key"
   - Copy key vừa tạo

3. Restart dev server:
   ```bash
   pnpm start --clear
   ```

---

### 3. Error: Quota exceeded

**Lỗi:**
```
I'm getting too many requests right now. Please try again in a few minutes...
```

**Nguyên nhân:**
- Vượt giới hạn free tier (60 requests/minute)

**Cách sửa:**
- Đợi 1-2 phút rồi thử lại
- Hoặc upgrade plan: https://ai.google.dev/pricing

**Giới hạn Free Tier:**
- 60 requests/minute
- 1,500 requests/day
- 1M tokens/month (input)

---

### 4. Error: Network error

**Lỗi:**
```
I'm having trouble connecting. Please check your internet connection...
```

**Nguyên nhân:**
- Không có internet
- Firewall/VPN chặn

**Cách sửa:**
1. Kiểm tra internet
2. Thử tắt VPN (nếu có)
3. Check firewall settings
4. Test API trực tiếp:
   ```bash
   curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY"
   ```

---

### 5. AI không xuất hiện trong Inbox

**Triệu chứng:**
- Inbox trống hoặc không thấy AI Assistant

**Cách sửa:**
1. Force refresh:
   ```bash
   pnpm start --clear
   ```

2. Check console logs:
   - Mở terminal → tìm errors
   - Check API key đã load chưa

3. Kiểm tra InboxContext:
   ```typescript
   // Trong console, thấy log này là OK:
   console.log('AI context loaded:', { listings, bookings });
   ```

---

### 6. AI trả lời chậm (> 10 giây)

**Nguyên nhân:**
- Context quá lớn
- Network chậm
- Server busy

**Cách tối ưu:**

1. Giảm context size (nếu cần):
   ```typescript
   // src/services/aiAssistantService.ts
   // Thay vì:
   ${listings.slice(0, 10).map(...)}
   
   // Dùng:
   ${listings.slice(0, 5).map(...)}  // Chỉ 5 listings
   ```

2. Check network speed

3. Thử model khác:
   ```typescript
   model: 'gemini-pro'  // Legacy nhưng có thể nhanh hơn
   ```

---

### 7. Typing indicator không tắt

**Triệu chứng:**
- "AI thinking..." không biến mất
- Response đã về nhưng typing vẫn hiển thị

**Cách sửa:**
1. Đóng và mở lại chat
2. Restart app nếu cần

**Debug:**
```typescript
// Trong InboxContext, check:
setTypingMap((prev) => ({ ...prev, [AI_ASSISTANT_ID]: false }));
```

---

### 8. Chat history bị mất

**Nguyên nhân:**
- Chat history chỉ lưu trong memory (session)
- App restart = mất history

**Giải pháp:**
- Đây là behavior mong muốn (không persist)
- Nếu muốn persist, cần thêm AsyncStorage:
  ```typescript
  // TODO: Implement persistence
  await AsyncStorage.setItem('ai-chat-history', JSON.stringify(messages));
  ```

---

### 9. AI không biết về bookings của tôi

**Nguyên nhân:**
- Chưa đăng nhập
- Context chưa load

**Cách sửa:**
1. Đăng nhập trước
2. Đợi context load (vài giây)
3. Thử hỏi lại

**Test:**
```typescript
// Trong console, check:
console.log('AI context:', aiContext);
// Phải thấy: { listings: [...], bookings: [...] }
```

---

### 10. Response bị cắt ngang chừng

**Nguyên nhân:**
- Response quá dài (> token limit)
- Network interrupted

**Cách sửa:**
- Hỏi ngắn gọn hơn
- Hoặc chia nhỏ câu hỏi:
  ```
  ❌ "Tell me everything about all tours"
  ✅ "List 5 beach resorts under $100"
  ```

---

## 🛠️ Debug Tools

### 1. Check API Key
```typescript
// Trong app console:
console.log('API Key:', process.env.EXPO_PUBLIC_GEMINI_API_KEY);
// Phải thấy: AIza...
```

### 2. Test Gemini API trực tiếp
```bash
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_API_KEY"}'
```

### 3. Check Context Loading
```typescript
// Thêm log vào InboxContext:
useEffect(() => {
  console.log('AI Context loaded:', aiContext);
}, [aiContext]);
```

### 4. Monitor Network
- Expo DevTools → Network tab
- Tìm requests đến `generativelanguage.googleapis.com`
- Check status code: 200 = OK

---

## 📋 Checklist khi gặp lỗi

- [ ] Check `.env` có `EXPO_PUBLIC_GEMINI_API_KEY`
- [ ] API key hợp lệ (test bằng curl)
- [ ] Restart dev server với `--clear`
- [ ] Check console logs (terminal + browser)
- [ ] Network có hoạt động không
- [ ] Model name đúng: `gemini-1.5-flash-latest`
- [ ] Quota chưa hết (check dashboard)
- [ ] App đã update code mới nhất

---

## 🆘 Liên hệ Support

Nếu vẫn gặp lỗi sau khi thử các cách trên:

1. **Copy full error message**
2. **Screenshot console logs**
3. **Check Gemini API Status:**
   - https://status.cloud.google.com/

4. **Report issue với:**
   - Error message đầy đủ
   - Steps to reproduce
   - Environment (iOS/Android/Web)
   - API key status (có/không, valid/invalid)

---

## 📚 Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Model Reference](https://ai.google.dev/models/gemini)
- [Error Codes](https://ai.google.dev/api/rest/v1beta/ErrorCode)
- [Quota & Limits](https://ai.google.dev/pricing)
- [Status Page](https://status.cloud.google.com/)

---

**Last Updated:** 2026-11-17  
**Version:** 2.0.1
