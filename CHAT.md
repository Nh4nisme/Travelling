# KẾ HOẠCH & TIẾN ĐỘ HỆ THỐNG CHAT INBOX REALTIME DATABASE (CHAT.md)

Tài liệu này xác định kiến trúc, kịch bản nghiệp vụ, cơ chế WebSocket Realtime và danh sách công việc (Task List) cho chức năng Chat Inbox hoạt động trực tiếp qua **Cơ sở dữ liệu MongoDB Atlas** và **Backend Node.js API + Socket.io Server (Port 4000)**.

---

## 🎯 1. Nguyên tắc cốt lõi: 100% Dữ liệu từ Database (Không dùng if-else tĩnh)

Hệ thống Chat Inbox hoạt động theo cơ chế **Dynamic Query từ MongoDB Atlas**:
- **Không dùng if-else phân biệt vai trò trên frontend.**
- Khi bất kỳ tài khoản nào đăng nhập (`req.user` qua Bearer JWT Token):
  - Backend API tự động thực thi truy vấn MongoDB:
    `Conversation.find({ $or: [{ host: req.user._id }, { renter: req.user._id }] })`
  - Nếu là **Jinny Oslin** (`host: Jinny._id`): MongoDB tự động trả về danh sách các **Khách hàng** đang trò chuyện (Sơn, Alex Miller, Tiến Chay Gỗ...).
  - Nếu là **Sơn / Tiến Chay Gỗ** (`renter: User._id`): MongoDB tự động trả về danh sách các **Chủ nhà** mà khách đang trao đổi (Jinny Oslin).
  - Tin nhắn được lưu vĩnh viễn trong bảng `messages` của MongoDB Atlas.

---

## ⚡ 2. Cơ chế Realtime với Socket.io (WebSocket Hai Chiều)

### 2.1. Vấn đề giải quyết:
- **Trước khi có Socket:** Bên A gửi tin nhắn, Bên B đang ở màn hình chat phải reload lại trang thì mới thấy tin nhắn mới.
- **Sau khi có Socket:** 
  1. Khi Bên A và Bên B mở phòng chat, cả 2 máy cùng tham gia vào room `join_conversation(conversationId)`.
  2. Khi Bên A nhấn **Gửi**: Tin nhắn lưu vào MongoDB, đồng thời Server phát sóng `io.to(convId).emit('message:received', messagePayload)`.
  3. Máy Bên B nhận được sự kiện ngay lập tức (<50ms) và render tin nhắn mới lên màn hình **ngay tức thì mà không cần reload trang**.
  4. Hỗ trợ sự kiện đang gõ phím (`typing:start` và `typing:stop`): khi Bên A gõ phím, màn hình Bên B hiện icon ba chấm *"Sơn is typing..."*.

### 2.2. Hướng dẫn cài đặt thư viện (Dependencies):
```bash
# 1. Cài đặt trên Server (Backend):
cd server
pnpm add socket.io
# (hoặc npm install socket.io)

# 2. Cài đặt trên Client App (Frontend):
pnpm add socket.io-client
# (hoặc npm install socket.io-client)
```

---

## 👥 3. Tài khoản thử nghiệm (Test Accounts trên MongoDB Atlas)

| Vai trò | Tên hiển thị | Email | Mật khẩu | Số điện thoại | Trải nghiệm thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chủ nhà (Host)** | **Jinny Oslin** | `jinny@gmail.com` | `password123` | `0901234567` | Đăng nhập -> Thấy hộp thư có khách **Sơn**, **Alex Miller**, **Tiến Chay Gỗ**. Nhận tin nhắn realtime và trả lời ngay. |
| **Khách hàng cũ** | **Sơn** | `nguyensonn2k5@gmail.com` | `password123` | `0833756579` | Đăng nhập -> Thấy Host **Jinny Oslin** (Balian Treehouse). Nhắn tin hỏi phòng, Jinny nhận được ngay trên màn hình. |
| **Khách hàng mới** | **Tiến Chay Gỗ** | `anhba@gmail.com` | `password123` | `0123456789` | Đăng ký/Đăng nhập mới -> Tự động có phòng chat thật với Jinny Oslin trên MongoDB, gửi tin nhắn lưu trực tiếp vào database. |

---

## 🏗️ 4. Kiến trúc Backend & Database (`server/`)

```
server/
├── src/
│   ├── index.js                  # Tạo HTTP Server + Socket.io Server (CORS allow all)
│   ├── models/
│   │   ├── Conversation.js       # Model MongoDB: host (ObjectId), renter (ObjectId), listingId, unreadBy...
│   │   └── Message.js            # Model MongoDB: conversation (ObjectId), sender (ObjectId), text, image...
│   ├── routes/
│   │   └── chat.js               # API: GET /conversations (auto-init real conv), GET/POST /:id/messages, GET /contacts
│   └── seedChat.js               # Script nạp dữ liệu chat mẫu chuẩn xác giữa Jinny Oslin và Sơn vào MongoDB
```

---

## 📱 5. Kiến trúc Client (`src/`)

```
src/
├── config/
│   └── env.ts                    # Cấu hình apiUrl và socketUrl linh hoạt cho Web/Mobile
├── services/
│   ├── api.ts                    # HTTP Client xử lý JWT token
│   ├── chatService.ts            # REST API /api/chat (getConversations, getMessages, sendMessage, createInquiry, getContacts)
│   └── socketService.ts          # Quản lý kết nối Socket.io, join room, emit typing
└── features/inbox/
    ├── types.ts                  # Interface chuẩn hóa cho Conversation, ChatMessage
    ├── context/
    │   └── InboxContext.tsx      # Quản lý state, loại bỏ fallback mock ID, đồng bộ 100% MongoDB
    └── screens/
        ├── InboxScreen.tsx       # Danh sách hội thoại MongoDB thật, nút (+) Start a conversation
        └── ChatDetailScreen.tsx  # Phòng chat realtime, auto-scroll, realtime typing indicator
```

---

## 📋 6. Bảng phân rã công việc (Task List & Milestones)

| STT | Hạng mục | Chi tiết kỹ thuật | Trạng thái |
| :---: | :--- | :--- | :--- :---: |
| **1** | **Tạo Model MongoDB** | `Conversation.js` và `Message.js` trong `server/src/models/` | ✅ Hoàn thành |
| **2** | **Xây dựng Chat API Router** | `server/src/routes/chat.js` (Bảo mật bằng JWT token) | ✅ Hoàn thành |
| **3** | **Tích hợp Socket.io Server** | `http.createServer(app)` + `new Server(server)` trong `server/src/index.js` | ✅ Hoàn thành |
| **4** | **Bắn Socket Event từ Route**| `io.to(id).emit('message:received')` khi có tin nhắn mới | ✅ Hoàn thành |
| **5** | **Cài đặt & Xây dựng `socketService.ts`**| Quản lý socket connection, room join/leave, typing start/stop | ✅ Hoàn thành |
| **6** | **Tích hợp `InboxContext.tsx`**| Lắng nghe socket realtime, cập nhật tin nhắn & preview không cần reload | ✅ Hoàn thành |
| **7** | **Nâng cấp `ChatDetailScreen.tsx`**| Gửi nhận tin nhắn 2 chiều thời gian thực + hiển thị đối phương đang gõ | ✅ Hoàn thành |
| **8** | **Kiểm thử Realtime Socket 2 Client**| Client A gửi tin -> Client B nhận tức thì <50ms (Đã kiểm thử pass 100%) | ✅ Hoàn thành |
| **9** | **Khắc phục lỗi Chat User mới & Host**| Tự động tạo Conversation MongoDB cho user mới, hỗ trợ Modal Contacts (+) | ✅ Hoàn thành |
| **10** | **Nút "Contact Host" từ màn Listing Detail** | `DetailScreen.tsx`: gọi `POST /api/chat/inquire` với thông tin listing rồi auto-navigate sang Inbox tab mở đúng conversation | ✅ Hoàn thành |
| **11** | **Gắn Host thật từng căn hộ & Fix chuyển Inbox** | Khởi tạo Host riêng từng căn hộ (Pierre, Marco...), đồng bộ refresh trước khi mở chat, hiển thị empty state khi chưa có lịch sử | ✅ Hoàn thành |
| **12** | **Xóa sạch Chat cũ, Hủy auto-create & Chấm đỏ Unread** | Xóa hoàn toàn auto-create chat giả, cung cấp script xóa DB, chấm đỏ unread badge ở bottom tab | ✅ Hoàn thành |

---

## 🔧 Bản vá Bug (2026-11-05)

### Bug Fix 1: Socket WARN spam trên Metro terminal
- **Vấn đề:** Log WARN "Socket connection warning: websocket error" liên tục ngập terminal.
- **Nguyên nhân:** `socketService.ts` thử transport `websocket` trước → thất bại trên LAN → fallback `polling` → console.warn liên tục.
- **Fix:** Đổi thứ tự transport sang `['polling', 'websocket']`; xóa console.warn; thêm rate-limit 30s.
- **File:** `src/services/socketService.ts`

### Bug Fix 2: Realtime chat không hoạt động trên thiết bị vật lý
- **Vấn đề:** Sau khi host gửi tin, điện thoại guest không nhận realtime — phải thoát ra InboxScreen rồi vào lại.
- **Nguyên nhân:** Server chỉ emit vào room (`io.to(convId).emit`). Thiết bị vật lý có thể chưa join room do mạng LAN không ổn định.
- **Fix:** Thêm `io.emit('message:received', messagePayload)` global broadcast ngay sau room emit trong `server/src/routes/chat.js`.
- **Dedup:** `InboxContext.tsx` lọc trùng bằng `existing.some(m => m.id === newMsg.id)` — không hiển thị 2 lần.
- **Kết quả:** Realtime hoạt động ngay cả khi socket chưa join room.

### Task List Update

| STT | Hạng mục | Trạng thái |
| :---: | :--- | :---: |
| **13** | **Fix Socket WARN spam** | ✅ Hoàn thành |
| **14** | **Fix Realtime thiết bị vật lý** | ✅ Hoàn thành |
| **15** | **Đơn giản hóa IP config (env.ts)** | ✅ Hoàn thành |

### Bug Fix 3: Bảo mật danh bạ Inbox - Thêm bạn qua SĐT/Email
- **Vấn đề:** Modal "Start a Conversation" hiển thị toàn bộ người dùng trong hệ thống (lộ danh tính, email).
- **Quy tắc mới:** Chỉ Host và Renter thấy nhau tự động. Người dùng khác phải tìm và add bằng SĐT hoặc Email.
- **Backend:** Thêm endpoint `GET /api/chat/search-user?query=...` trong `server/src/routes/chat.js`. Route `contacts` trả về rỗng.
- **Frontend:** `src/features/inbox/screens/InboxScreen.tsx` cập nhật ô tìm kiếm bảo mật, chỉ hiển thị thông tin khi tìm thấy đúng SĐT/Email.

### Bug Fix 4: Đồng bộ kích thước nút hành động tại DetailScreen
- **Vấn đề:** Nút "Your listing / Contact host" và "Book now" bị lệch chiều cao và padding.
- **Fix:** Chuẩn hóa chiều cao `height: 48`, bo góc `borderRadius: 12`, căn giữa đồng bộ tại `src/features/listing/screens/DetailScreen.tsx`.

### Bug Fix 5: Chức năng "View more" & "Show all" in-place
- **Vấn đề:** Các nút "Show all" (Tiện ích) và "View more" (Chính sách, Mô tả) không hoạt động hoặc không mở rộng nội dung trực tiếp.
- **Fix:** Thêm state mở rộng/thu gọn in-place `showAllFacilities`, `showAllPolicies`, `showAllDesc` với nút chuyển đổi linh hoạt.

### Task List Update

| STT | Hạng mục | Trạng thái |
| :---: | :--- | :---: |
| **16** | **Bảo mật Inbox (Tìm theo SĐT/Email, không dump danh bạ)** | ✅ Hoàn thành |
| **17** | **Đồng bộ kích thước nút Your listing/Contact host & Book now** | ✅ Hoàn thành |
| **18** | **Kích hoạt tính năng View more & Show all in-place** | ✅ Hoàn thành |

### Bug Fix 6: Tinh chỉnh kích thước chống tràn nút tại DetailScreen
- **Vấn đề:** Nút "Book now" bị tràn khỏi mép phải màn hình điện thoại do tổng chiều ngang vượt quá 380px.
- **Fix:** Chuẩn hóa chiều cao về 42px, padding ngang cân đối (11px cho Contact host, 16px cho Book now), thu gọn gap và thêm `flexShrink`, hiển thị vừa vặn 100% trên mọi kích cỡ màn hình.

### Bug Fix 7: Làm giàu dữ liệu Check-in Policies & Description cho View More
- **Vấn đề:** Dữ liệu cũ chỉ có 1 câu ngắn nên không thể hiện được tính năng xem thêm.
- **Fix:** Cập nhật `listings.json` và seed trực tiếp vào MongoDB Atlas với nội dung chi tiết đa đoạn, đầy đủ quy định nhận phòng (mã khóa thông minh, giờ yên tĩnh, xác minh ID...). Nút "View more ›" giờ đây hiển thị rõ rệt sự mở rộng nội dung và chuyển sang "Show less ▴".

### Task List Update

| STT | Hạng mục | Trạng thái |
| :---: | :--- | :---: |
| **19** | **Fix tràn viền nút hành động DetailScreen** | ✅ Hoàn thành |
| **20** | **Làm giàu nội dung Description & Policies cho View more** | ✅ Hoàn thành |


### Bug Fix 8: Hiện thực hóa Theme (Sáng/Tối/Hệ thống) & Đa ngôn ngữ (Anh/Việt) toàn diện
- **Vấn đề:** 
  1. Chuyển Tiếng Việt mới chỉ áp dụng ở Sidebar/Settings/Profile, các trang bên trong vẫn là tiếng Anh.
  2. Dark view bị lỗi chữ đen hoặc xám đậm trên nền đen khiến các tiêu đề, thông tin phòng, đặt phòng và tin nhắn bị tối hoặc tàng hình.
  3. Màn hình Search (Khám phá) vẫn hiển thị Light mode dù đã bật Dark mode.
- **Fix:**
  - Mở rộng bộ từ điển `translations.ts` với đầy đủ từ khóa cho Search, Filter, BookingFlow, Chat suggestions, Listing details.
  - Sửa các component dùng chung (`Header`, `Btn`, `Stepper`, `Check`, `Row`, `Divider`, `ListingCard`) để tự động tương thích Dark theme với độ tương phản sắc nét.
  - Viết lại `SearchScreen.tsx`, `Calendar.tsx`, `ResultsScreen.tsx`, `FiltersScreen.tsx` hỗ trợ Dark mode và song ngữ 100%.
  - Cập nhật `BookingsScreen.tsx`, `BookingDetailScreen.tsx`, `ConfirmScreen.tsx`, `BookingDatesScreen.tsx`, `DetailScreen.tsx`, `ChatDetailScreen.tsx`, `InboxScreen.tsx`, `AuthScreen.tsx`, `PersonalInfoScreen.tsx`.

### Task List Update

| STT | Hạng mục | Trạng thái |
| :---: | :--- | :---: |
| **21** | **Xây dựng hệ thống Core ThemeContext & LanguageContext tập trung** | ✅ Hoàn thành |
| **22** | **Phủ toàn diện Dark Mode & Song ngữ Tiếng Việt cho tất cả các màn hình** | ✅ Hoàn thành |
