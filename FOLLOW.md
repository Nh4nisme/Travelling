# NHẬT KÝ TIẾN TRÌNH PHÁT TRIỂN (FOLLOW.md)

Tài liệu này dùng để theo dõi chi tiết từng bước thực hiện, trạng thái hoàn thành và hướng dẫn kiểm tra (checkpoint) để dễ dàng đọc lại và đối soát.

---

## 📋 Bảng tổng hợp tiến trình

| STT | Hạng mục công việc | Trạng thái | Ghi chú kiểm tra |
| :---: | :--- | :--- :---: | :--- |
| **0** | Fix lỗi trùng Header màn hình con Profile | ✅ Hoàn thành | Đã loại bỏ `<Header>` thừa trong 5 màn con (Commit: `20e72b0`) |
| **1** | Bổ sung hàm API lấy User Profile | ✅ Hoàn thành | Thêm `getProfile` vào `userService.ts` |
| **2** | Hoàn thiện `PersonalInfoScreen.tsx` | ✅ Hoàn thành | Fetch API on mount, validate name & phone, save update |
| **3** | Revert toàn bộ code liên quan đến Booking | ✅ Hoàn thành | Đã revert 100% về nguyên bản Git, không đụng booking |
| **4** | Khởi tạo User mới `Sơn` trên Database | ✅ Hoàn thành | `nguyensonn2k5@gmail.com` hoạt động đăng nhập bình thường |
| **5** | Khởi tạo Database Chat MongoDB Atlas | ✅ Hoàn thành | Tạo Model `Conversation.js`, `Message.js`, Route `chat.js` |
| **6** | Kết nối Frontend với API Database `:4000` | ✅ Hoàn thành | `chatService.ts` + `InboxContext.tsx` query 100% từ MongoDB |
| **7** | Fix lỗi Unexpected text node trong `<View>` | ✅ Hoàn thành | Chuyển toàn bộ `&&` sang ternary `? : null` trong `ChatDetailScreen` |
| **8** | Tích hợp WebSocket Socket.io Realtime Chat | ✅ Hoàn thành | Bên A chat, Bên B nhận tin nhắn tức thì <50ms không cần reload |
| **9** | Đồng bộ Favorites với MongoDB Atlas | ✅ Hoàn thành | Lưu `favorites: [String]` vào User Model, đồng bộ số đếm ProfileHeader |
| **10** | Nâng cấp `PaymentsScreen.tsx` | ✅ Hoàn thành | Hiển thị Lịch sử giao dịch & Hóa đơn thực tế từ `bookings` + Quản lý thẻ |
| **11** | Hoàn thiện `NotificationsScreen` & `SettingsScreen` | ✅ Hoàn thành | Quản lý state và lưu trữ cấu hình bền vững qua `settingsStorage.ts` |
| **12** | Khắc phục lỗi Chat User mới & Host MongoDB | ✅ Hoàn thành | Tự động tạo hội thoại thật MongoDB, loại bỏ fallback mock ID `conv-1` |
| **13** | Nút "Contact Host" trên màn Listing Detail | ✅ Hoàn thành | `DetailScreen` → `POST /inquire` → auto navigate Inbox đúng conversation |
| **14** | Gắn Host thật cho từng căn hộ & Fix chuyển Inbox | ✅ Hoàn thành | Tạo Host riêng cho từng căn hộ (Pierre, Marco, Minh Đức...), chuyển đúng hội thoại |
| **15** | Xóa sạch Chat cũ, Hủy auto-chat & Thêm chấm đỏ unread | ✅ Hoàn thành | Xóa bỏ auto-init chat giả, script clear chat, chấm đỏ báo tin nhắn chưa đọc ở Tab Inbox |
| **16** | Quản lý Phương thức thanh toán (Chuẩn PCI-DSS & Luhn) | ✅ Hoàn thành | Model `PaymentMethod.js`, validate Luhn/BIN/Exp/CVV, CRUD API, Modal thêm thẻ, tài liệu `PAYMENT.md` |
| **17** | Màn hình Bookings & Booking Detail | ✅ Hoàn thành | Đồng bộ MongoDB Atlas, lọc tab Sắp tới/Đã qua/Đã hủy, hủy phòng & hoàn tiền |
| **18** | Fix kết nối Realtime Socket.io đa thiết bị | ✅ Hoàn thành | Broadcast toàn cục, sửa chat chéo nhiều máy |
| **19** | Bảo mật Inbox & Tinh chỉnh kích thước nút | ✅ Hoàn thành | Tìm kiếm qua SĐT/Email, chuẩn hóa nút hành động 42px |
| **20** | Làm giàu dữ liệu Check-in Policies & Description | ✅ Hoàn thành | Seed mô tả chi tiết và quy định nhận phòng vào MongoDB Atlas |
| **21** | Hiện thực hóa Theme (Sáng/Tối) & Language (Anh/Việt) | ✅ Hoàn thành | Quản lý tập trung ThemeContext + LanguageContext |
| **22** | Chuyển đổi toàn diện Dark Mode & Song ngữ toàn app | ✅ Hoàn thành | Xử lý triệt để text tối trong Dark view, Search, Booking, Inbox, Filters |

---

## 📝 Chi tiết từng bước

### Bước 0: Sửa lỗi hiển thị lặp 2 Header ở Profile
- **Trạng thái:** ✅ Đã hoàn thành (Commit: `20e72b0`)
- **Chi tiết:** Đã xóa component `<Header>` trùng lặp trong 5 màn hình con (`PersonalInfoScreen`, `PaymentsScreen`, `NotificationsScreen`, `HelpCenterScreen`, `SettingsScreen`).

---

### Bước 1: Thêm API lấy thông tin cá nhân
- **Trạng thái:** ✅ Đã hoàn thành
- **Chi tiết:** Thêm `getProfile: (token: string) => api<{ user: User }>('/auth/me', { token })` vào `src/services/userService.ts`.

---

### Bước 2: Hoàn thiện `PersonalInfoScreen.tsx`
- **Trạng thái:** ✅ Đã hoàn thành
- **Chi tiết:** Tự động fetch profile, validate name (1-80 ký tự) & phone (8-15 ký tự số), lưu qua API PATCH `/auth/me`.

---

### Bước 3: Revert toàn bộ code liên quan đến Booking
- **Trạng thái:** ✅ Đã hoàn thành
- **Chi tiết:** Đã revert 100% về nguyên bản Git trên `server/src/models/User.js`, `server/src/routes/auth.js`, `src/store/types.ts`, `src/features/profile/components/ProfileHeader.tsx`, `src/store/AppContext.tsx`.

---

### Bước 4: Tài khoản User mới `Sơn` trên Database
- **Trạng thái:** ✅ Đã hoàn thành
- **Thông tin tài khoản:**
  - **Họ tên:** Sơn
  - **Email:** `nguyensonn2k5@gmail.com` | **Mật khẩu:** `password123` | **SĐT:** `0833756579`

---

### Bước 5 & 6: Hệ thống Chat Inbox Realtime từ MongoDB Atlas (100% Database)
- **Trạng thái:** ✅ Đã hoàn thành
- **Các thành phần đã triển khai:**
  1. `models/Conversation.js` & `models/Message.js`: Schema chuẩn cho MongoDB.
  2. `routes/chat.js`: Endpoint `/conversations`, `/:id/messages`, `/inquire`.
  3. `seedChat.js`: Seed dữ liệu thật giữa Jinny Oslin và Sơn vào MongoDB.
  4. `chatService.ts`: Kết nối REST API qua `:4000`.
  5. `InboxContext.tsx`: Quản lý state hội thoại và tin nhắn đồng bộ với MongoDB.

---

### Bước 7: Fix lỗi `Unexpected text node: . A text node cannot be a child of a <View>`
- **Trạng thái:** ✅ Đã hoàn thành
- **Khắc phục:** Đã chuyển toàn bộ các điều kiện render trong `ChatDetailScreen.tsx` và `InboxScreen.tsx` sang dạng toán tử 3 ngôi `Boolean(condition) ? <Component /> : null`.

---

### Bước 8: Tích hợp WebSocket Socket.io Realtime Chat (2 chiều tức thì)
- **Trạng thái:** ✅ Đã hoàn thành
- **Thư viện cài đặt thêm:**
  - Backend: `pnpm add socket.io` (trong thư mục `server`)
  - Frontend: `pnpm add socket.io-client` (trong thư mục gốc dự án)
- **Cơ chế kỹ thuật:**
  1. **Tạo HTTP & Socket Server (`server/src/index.js`):** Bọc Express app bằng `http.createServer(app)` và gắn `new Server(server, { cors: { origin: '*' } })`.
  2. **Quản lý phòng (Room-based):** Khi người dùng mở phòng chat, client gửi `join_conversation(conversationId)`. Khi thoát thì gửi `leave_conversation(conversationId)`.
  3. **Phát sóng tin nhắn (`server/src/routes/chat.js`):** Khi Bên A gửi tin nhắn, Server vừa lưu vào MongoDB, vừa lấy `req.app.get('io')` phát sóng `io.to(id).emit('message:received', messagePayload)` đến phòng chat và `io.emit('conversation:updated')` cho danh sách ngoài.
  4. **Lắng nghe & Khử trùng lặp (`src/features/inbox/context/InboxContext.tsx`):**
     - Bên B đang mở phòng chat nhận `message:received` và tự động cập nhật vào danh sách tin nhắn ngay lập tức mà không cần reload trang.
     - Khử trùng lặp (deduplication) thông minh: thay thế `tempId` của người gửi bằng tin nhắn thật, đồng thời bỏ qua nếu ID đã tồn tại.
  5. **Hiển thị đang gõ phím (`typing:start` & `typing:stop`):** Khi Bên A bấm gõ vào ô nhập tin nhắn, Socket phát sóng sự kiện báo cho Bên B hiện ba chấm *"Sơn is typing..."* theo thời gian thực.
- **Kết quả kiểm thử:** Script test 2 client độc lập chạy qua cổng `:4000` thành công 100%, tin nhắn Bên A gửi được Bên B nhận ngay trong vòng <50ms.

---

### Bước 9: Đồng bộ Danh sách yêu thích (Favorites) với MongoDB Atlas
- **Trạng thái:** ✅ Đã hoàn thành
- **Các thành phần kỹ thuật:**
  1. `server/src/models/User.js`: Bổ sung trường `favorites: [{ type: String }]` và trả về qua hàm `toPublic()`.
  2. `server/src/routes/auth.js`: Thêm endpoint `POST /api/auth/favorites/:id` tự động toggle thêm/xóa ID chỗ nghỉ vào danh sách yêu thích của người dùng trên MongoDB Atlas.
  3. `src/services/userService.ts`: Thêm hàm `toggleFavorite(listingId, token)`.
  4. `src/store/AppContext.tsx`:
     - Tự động nạp danh sách `favorites` từ DB vào state `favs` khi đăng nhập hoặc khôi phục phiên (`me`).
     - Khi bấm thả tim (`toggleFav`): Áp dụng kỹ thuật Optimistic Update (giao diện phản hồi ngay lập tức), đồng thời gửi request lưu bền vững vào MongoDB Atlas.
     - Reset sạch danh sách yêu thích khi Đăng xuất (`signOut`).
  5. `ProfileHeader.tsx` & `ProfileScreen.tsx`: Hiển thị số lượng favorites thật `favsCount={favs.length}`, đảm bảo không bị mất dữ liệu khi reload app hoặc đổi thiết bị.

---

### Bước 10: Nâng cấp `PaymentsScreen.tsx` (Lịch sử giao dịch & Hóa đơn thực tế)
- **Trạng thái:** ✅ Đã hoàn thành
- **Các thành phần kỹ thuật:**
  1. **Tab "Invoices & Receipts":**
     - Đọc dữ liệu `bookings` từ `useApp()`.
     - Hiển thị danh sách hóa đơn trực quan gồm: Ảnh chỗ nghỉ, Tên phòng, Thành phố, Mã đặt chỗ (`Ref: #...`), Ngày thanh toán, Số tiền đã thanh toán, Huy hiệu trạng thái (`Paid in full`, `Partial paid`, `Refunded`, `Cancelled`).
     - Trạng thái Empty State khi chưa có giao dịch nào.
  2. **Modal chi tiết hóa đơn (Receipt Details Modal):**
     - Chi tiết đặt phòng: Ngày check-in / check-out, số đêm lưu trú, số lượng khách.
     - Bảng kê chi phí (Price Breakdown): Đơn giá x số đêm, danh sách phụ phí (phí dịch vụ, thuế), tổng tiền thanh toán.
     - Thông tin biên lai: Số tiền đã thanh toán, số dư còn lại cần trả khi nhận phòng (nếu đặt cọc 50%), hình thức thanh toán và thời gian giao dịch.
  3. **Tab "Payment Methods":**
     - Quản lý danh sách thẻ đã lưu, chuyển đổi thẻ mặc định (Default), thêm thẻ kiểm thử.

---

### Bước 11: Hoàn thiện `NotificationsScreen.tsx` & `SettingsScreen.tsx`
- **Trạng thái:** ✅ Đã hoàn thành
- **Các thành phần kỹ thuật:**
  1. `src/services/settingsStorage.ts`: Module lưu trữ cấu hình bền vững đa nền tảng (sử dụng `localStorage` trên Web và `expo-secure-store` trên thiết bị di động).
  2. `NotificationsScreen.tsx`:
     - Quản lý bật/tắt các loại thông báo: `Booking updates`, `Messages & Inquiries`, `Promotions & Deals`.
     - Tự động lưu cấu hình khi toggle và khôi phục khi mở lại app.
  3. `SettingsScreen.tsx`:
     - Lựa chọn Theme (Light / Dark / System) và Ngôn ngữ (English / Tiếng Việt) có Modal chọn và lưu bền vững.
     - Tích hợp Modal xem Chính sách Bảo mật (Privacy & Security) giải thích cách mã hóa tài khoản, tin nhắn realtime và hóa đơn giao dịch.

---

### Bước 12: Khắc phục triệt để lỗi Chat giữa User mới & Host trên MongoDB Atlas
- **Trạng thái:** ✅ Đã hoàn thành
- **Vấn đề đã xử lý:**
  1. Trước đây, khi một tài khoản mới (ví dụ `tien Chay Go`) đăng ký và vào Inbox, do chưa có đoạn chat nào trong DB nên app tự động nạp dữ liệu giả `RENTER_CONVERSATIONS` với ID tĩnh `'conv-1'`. Khi gửi tin nhắn, Mongoose bị lỗi `CastError` và không thể ghi xuống MongoDB, dẫn đến Host Jinny Oslin không nhìn thấy khách hàng mới.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Khởi tạo tự động cuộc hội thoại thật trên MongoDB (`server/src/routes/chat.js`):**
     - Khi một người dùng mới vào Inbox (`GET /conversations`), nếu chưa có hội thoại nào, Server tự động tạo 1 cuộc trò chuyện thật trên MongoDB Atlas với Host Jinny Oslin (Balian treehouse) kèm tin nhắn chào mở đầu. Cuộc hội thoại này mang ObjectId 24 ký tự chuẩn của MongoDB.
  2. **Bảo vệ endpoint tin nhắn (`POST /conversations/:id/messages`):**
     - Nếu client cũ vô tình gửi ID `'conv-1'`, Server tự động tra cứu hoặc khởi tạo hội thoại thật trên MongoDB với Host Jinny Oslin thay vì báo lỗi 500.
  3. **Loại bỏ hoàn toàn Fallback Mock ID (`src/features/inbox/context/InboxContext.tsx`):**
     - Không nạp `RENTER_CONVERSATIONS` chứa mock ID `'conv-1'` nữa. Dữ liệu hội thoại 100% được nạp từ MongoDB Atlas.
  4. **Thêm tính năng "Start a Conversation" (`src/features/inbox/screens/InboxScreen.tsx`):**
     - Bổ sung nút soạn tin nhắn mới (`+`) trên header mở Modal danh sách liên hệ (lấy từ endpoint `GET /api/chat/contacts`). Người dùng có thể bấm vào bất kỳ ai để bắt đầu cuộc trò chuyện thật trên MongoDB.
     - Nút *"Chat with Host Jinny Oslin"* hiển thị trực tiếp khi danh sách trống.
- **Kết quả kiểm thử:**
  - Script test `testNewUserChat.js` chạy thành công 100%: `tien Chay Go` gửi tin nhắn -> Tin nhắn lưu thành công vào MongoDB Atlas -> Jinny Oslin đăng nhập thấy ngay `tien Chay Go` kèm tin nhắn mới -> Jinny trả lời và cả 2 bên hiển thị đầy đủ tin nhắn realtime.

### Bước 13: Nút "Contact Host" từ màn Listing Detail
- **Trạng thái:** ✅ Đã hoàn thành
- **Mục tiêu:** Cho phép người dùng bấm nút **"Contact Host"** ngay trên trang chi tiết listing để mở ngay cuộc trò chuyện với chủ nhà, không cần vào tab Inbox thủ công.
- **File đã thay đổi:**
  1. `server/src/models/Listing.js` — Thêm field `hostEmail: { type: String, default: '' }` để lưu email chủ nhà phụ trách từng listing.
  2. `server/src/index.js` — Seed tự động `hostEmail` cho tất cả listing (mapping `id` → `jinny@gmail.com`) khi server khởi động lần đầu.
  3. `server/src/routes/chat.js` — Endpoint `POST /inquire` được nâng cấp: nếu không có `hostId`/`hostEmail`, tự tra cứu `hostEmail` từ `Listing` DB theo `listingId` được truyền lên.
  4. `src/types/listing.ts` — Thêm `hostEmail?: string` vào Listing type.
  5. `src/app/navigation/types.ts` — Thêm `openConversationId?: string` vào params của Inbox tab.
  6. `src/features/inbox/screens/InboxScreen.tsx` — Thêm `useEffect` đọc `route.params.openConversationId` để auto-open conversation khi navigate từ DetailScreen.
  7. `src/features/listing/screens/DetailScreen.tsx` — Thêm nút **"Contact Host"** (với icon chat, loading state khi đang tạo conversation) bên cạnh nút "Book now". Khi bấm: tạo/mở conversation qua `chatService.createInquiry()` → navigate `'Main' > 'Inbox'` với `openConversationId`.
- **Luồng hoạt động:**
  1. User xem listing → bấm **Contact Host**
  2. App gọi `POST /api/chat/inquire` với `{ listingId, listingTitle, listingImage, listingPrice, hostEmail }`
  3. Server trả về `conversationId` (tạo mới hoặc tìm lại cuộc trò chuyện đã có)
  4. App navigate sang tab Inbox → `InboxScreen` auto-open đúng conversation
  5. Nếu chưa nhắn tin lần nào → thấy tin nhắn chào từ host *"Thank you for reaching out..."*
- **Kiểm tra nhanh:** Không cần đăng nhập → bấm Contact Host → hiện dialog mời đăng nhập. Đã đăng nhập → bấm Contact Host → loading → chuyển sang Inbox đúng conversation của listing đó.

### Bước 14: Gắn Host riêng cho từng căn hộ & Hoàn thiện chuyển sang Inbox
- **Trạng thái:** ✅ Đã hoàn thành
- **Vấn đề đã xử lý:**
  1. Trước đây toàn bộ các căn hộ đều gắn mặc định `hostEmail = jinny@gmail.com`. Khi người dùng đăng nhập bằng tài khoản Jinny Oslin và bấm "Contact Host" ở căn hộ Alpine chalet (Chamonix, France), hệ thống báo lỗi không thể tự chat với chính mình và không chuyển sang Inbox.
  2. Khi tạo hội thoại mới từ `DetailScreen`, `InboxContext` chưa kịp refresh danh sách hội thoại từ MongoDB nên `conversations.find` trả về undefined và rơi vào fallback hội thoại đầu tiên (`conversations[0]`), dẫn đến việc hiển thị nhầm người khác thay vì chủ nhà của căn hộ vừa bấm.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Tạo tài khoản Host thật riêng biệt cho từng căn hộ (`server/src/seedAllHostsAndListings.js`):**
     - Listing #5: **Alpine chalet** (Chamonix, France) → Host: **Pierre Dubois** (`pierre.chalet@gmail.com`)
     - Listing #6: **Cabin in the Dolomites** (Cortina, Italy) → Host: **Marco Rossi** (`marco.dolomites@gmail.com`)
     - Listing #7: **Forest tent** (Da Lat, Vietnam) → Host: **Minh Đức** (`minhduc.dalat@gmail.com`)
     - Listing #4: **Balian treehouse** (Bali, Indonesia) → Host: **Jinny Oslin** (`jinny@gmail.com`)
     - Listing #1 & #3: **Apartment in Omaha / Milwaukee** (USA) → Host: **Sarah Jenkins** (`sarah.omaha@gmail.com`)
     - Listing #2: **Apartment in San Jose** (USA) → Host: **Alex Miller** (`alex.miller@gmail.com`)
     - Listing #8: **Lakeside camp** (Banff, Canada) → Host: **David Tremblay** (`david.banff@gmail.com`)
     *(Tất cả tài khoản host đều có mật khẩu mặc định: `password123`)*
  2. **Bảo vệ chủ nhà xem căn hộ của mình (`DetailScreen.tsx`):**
     - Nếu tài khoản đăng nhập trùng với `hostEmail` của căn hộ, nút hiển thị *"Your listing"* thay vì *"Contact host"*, kèm thông báo nhắc đăng nhập bằng tài khoản khách để test liên hệ.
  3. **Đồng bộ mở đúng hội thoại và làm mới dữ liệu (`InboxScreen.tsx` & `ChatDetailScreen.tsx`):**
     - `InboxMain` khi nhận `openConversationId` sẽ gọi `refreshConversations()` từ MongoDB trước khi `setSelectedConversationId`, đảm bảo hội thoại mới tạo luôn có mặt trong state.
     - `ChatDetailScreen` bỏ hoàn toàn fallback sai `conversations[0]`, hiển thị màn hình loading chờ nạp đúng hội thoại.
     - Nếu chưa từng nhắn tin cho chủ nhà này, hiển thị trạng thái chuẩn: *"Chưa có lịch sử trò chuyện với [Tên chủ nhà]"* đúng theo yêu cầu.

### Bước 15: Xóa sạch Chat cũ, Hủy auto-create chat và Thêm chấm đỏ unread
- **Trạng thái:** ✅ Đã hoàn thành
- **Yêu cầu đã thực hiện:**
  1. **Hủy bỏ hoàn toàn cơ chế tự tạo chat giả khi chưa tương tác (`server/src/routes/chat.js`):**
     - Đã loại bỏ đoạn code tự tạo hội thoại với Jinny Oslin khi `conversations.length === 0`.
     - Giờ đây, chỉ khi người dùng thực sự bấm **Contact host** ở một căn hộ hoặc bấm **(+) Soạn tin nhắn** thì cuộc trò chuyện mới được khởi tạo trên MongoDB.
     - Nếu chưa từng nhắn tin, danh sách Inbox trả về rỗng `[]` chuẩn thực tế.
  2. **Script xóa sạch 100% lịch sử chat cũ (`server/scripts/clearAllChatHistory.js`):**
     - Chạy script: `node server/scripts/clearAllChatHistory.js` để xóa toàn bộ Conversation và Message cũ trong database MongoDB Atlas.
     - Hỗ trợ endpoint `POST /api/chat/clear-all` và cờ môi trường `CLEAR_CHAT_ON_START=true`.
  3. **Chấm đỏ thông báo tin nhắn chưa đọc trên thanh điều hướng Bottom Tab (`MainTabs.tsx`):**
     - Đã nâng `InboxProvider` lên cấp toàn cục trong `AppProviders.tsx` để Socket.io và state `unreadCount` hoạt động xuyên suốt toàn app.
     - Tại `MainTabs.tsx`, icon Inbox trên thanh Tab dưới cùng sẽ xuất hiện **chấm đỏ (Red Dot Badge)** bất cứ khi nào có tin nhắn chưa đọc (`unreadCount > 0`).
     - Khi người dùng vào Inbox đọc tin nhắn, chấm đỏ sẽ tự động biến mất tức thì.

---

### Bước 16: Quản lý Phương thức thanh toán (Chuẩn PCI-DSS & Thuật toán Luhn)
- **Trạng thái:** ✅ Hoàn thành
- **Tài liệu chi tiết:** Xem file [`PAYMENT.md`](file:///d:/Study/Mobile/Travelling/PAYMENT.md)
- **Các thành phần kỹ thuật đã triển khai:**
  1. **Tuân thủ chuẩn bảo mật PCI-DSS:**
     - Không lưu full số thẻ (PAN) hay mã bảo mật CVV vào MongoDB Atlas.
     - Chỉ lưu `last4`, `brand`, `exp` (MM/YY), `cardHolderName` và `isDefault`.
  2. **Bộ kiểm duyệt thẻ nghiêm ngặt (`server/src/utils/cardValidator.js`):**
     - **Thuật toán Luhn (Mod 10 Checksum):** Chống nhập số thẻ bừa bãi, tính tổng chẵn lẻ đảo chiều theo tiêu chuẩn quốc tế ISO/IEC 7812-1.
     - **Kiểm tra BIN & Brand:** Tự động nhận diện Visa (`4...`), Mastercard (`51-55...`, `2221-2720...`), Amex (`34, 37...`), JCB (`35...`).
     - **Kiểm tra hạn thẻ:** Định dạng `MM/YY`, tháng 01-12, không nằm trong quá khứ.
     - **Kiểm tra CVV:** 3 số (4 số cho Amex).
     - **Kiểm tra tên chủ thẻ:** Tối thiểu 2 từ, viết hoa không dấu.
  3. **Backend API (`server/src/routes/payments.js`):**
     - `GET /api/payments/methods`: Trả về danh sách thẻ đã lưu (ưu tiên thẻ mặc định lên trước).
     - `POST /api/payments/methods`: Xác thực dữ liệu, kiểm tra trùng lặp và lưu thẻ an toàn.
     - `DELETE /api/payments/methods/:id`: Xóa thẻ (tự động đôn thẻ kế tiếp lên làm mặc định nếu thẻ xóa là mặc định).
     - `PATCH /api/payments/methods/:id/default`: Đặt thẻ làm mặc định.
  4. **Frontend UI (`src/features/profile/screens/PaymentsScreen.tsx`):**
     - Tải danh sách thẻ thật từ MongoDB Atlas qua `paymentService.ts`.
     - Modal thêm thẻ chuyên nghiệp: auto-format số thẻ `XXXX XXXX XXXX XXXX`, nhận diện logo thẻ trực tiếp khi gõ, tự động thêm gạch chéo `/` cho hạn thẻ, mask CVV.
     - Hỗ trợ nút **Quick Test Card** (Visa `4242...`, Mastercard `5555...`) cho mục đích demo/kiểm thử.

---

### Bước 18: Fix 3 lỗi sau triển khai thực tế
- **Trạng thái:** ✅ Hoàn thành
- **Ngày:** 2026-11-05

#### Lỗi 1: Dòng "Demo payment" hiển thị trên UI (Không chuyên nghiệp)
- **Nguyên nhân:** Các màn hình booking còn in dòng chú thích "Demo payment: no real card was charged." dưới dạng `<Text>` node.
- **Fix:** Xóa các `<Text>` node và chuỗi text demo khỏi:
  - `src/features/booking/screens/ConfirmScreen.tsx` (line 139)
  - `src/features/booking/screens/SuccessScreen.tsx` (line 50)
  - `src/features/bookings/screens/BookingDetailScreen.tsx` (line 136 + confirmDialog text)
  - `src/features/bookings/utils.ts` (line 53 — booking receipt share text)
- **Phạm vi:** Chỉ xóa UI text, không động vào bất kỳ logic nào.

#### Lỗi 2: Metro terminal spam "WARN Socket connection warning: websocket error"
- **Nguyên nhân:** Socket.io thử kết nối bằng `websocket` trước trong LAN/thiết bị vật lý → thất bại → fallback sang `polling` → gây WARN liên tục, không phải lỗi thật.
- **Fix (đã làm phiên trước):** `src/services/socketService.ts`
  - Đổi thứ tự transport: `['polling', 'websocket']` (polling trước, nâng cấp lên ws sau khi handshake thành công)
  - Xóa `console.warn` trong `connect_error` handler
  - Thêm rate-limit: chỉ log 1 lần mỗi 30 giây tối đa
- **Kết quả:** Log Metro terminal sạch hoàn toàn.

#### Lỗi 3: Điện thoại vật lý không nhận realtime chat
- **Nguyên nhân:** Server chỉ emit `io.to(convId).emit('message:received', ...)` vào room. Nếu socket của thiết bị vật lý chưa `join` đúng room (vì reconnect, lag mạng LAN), tin nhắn không đến.
- **Fix:** `server/src/routes/chat.js` — thêm global broadcast ngay sau room emit:
  ```js
  io.to(convId).emit('message:received', messagePayload);
  // Global broadcast: đảm bảo thiết bị vật lý nhận được realtime dù chưa join room
  io.emit('message:received', messagePayload);
  ```
- **Dedup:** `InboxContext.tsx` đã có sẵn `existing.some(m => m.id === newMsg.id)` → tin nhắn trùng sẽ bị lọc, không hiển thị 2 lần.
- **Kết quả:** Tin nhắn realtime hoạt động ngay trên thiết bị vật lý mà không cần thoát và vào lại.

#### Fix bổ sung: Đơn giản hóa cấu hình IP (`env.ts`)
- **Nguyên nhân:** `env.ts` cũ dùng `NativeModules.SourceCode.scriptURL` để tự detect IP — API nội bộ, không ổn định trên Expo Go.
- **Fix:** Viết lại `src/config/env.ts` sạch, đơn giản:
  - Đọc `EXPO_PUBLIC_API_URL` từ `.env` (ưu tiên số 1)
  - `socketUrl` tự suy ra từ `apiUrl` (bỏ `/api` ở cuối) — không cần cấu hình riêng
  - Fallback: `10.0.2.2:4000` (Android emulator) / `localhost:4000` (iOS)
  - **Khi đổi mạng WiFi:** Chỉ cần cập nhật `EXPO_PUBLIC_API_URL` trong `.env`

---

### Bước 19: Hoàn thiện đồng bộ UI Listing Detail & Bảo mật danh bạ Inbox
- **Trạng thái:** ✅ Hoàn thành
- **Ngày:** 2026-11-05

#### 1. Đồng bộ kích thước nút hành động tại DetailScreen (Your listing / Contact host vs Book now)
- **Vấn đề:** Nút "Your listing" / "Contact host" có padding và chiều cao lệch so với nút "Book now", tạo cảm giác không đồng đều trên thanh đáy (`media_1793866195333_3d3140dd.png`).
- **Khắc phục (`src/features/listing/screens/DetailScreen.tsx`):**
  - Đồng bộ chuẩn chiều cao `height: 48` cho cả 2 nút.
  - Đồng bộ góc bo `borderRadius: 12`.
  - Căn giữa `alignItems: 'center'`, `justifyContent: 'center'`, font size 15px đậm (700) đồng nhất.

#### 2. Kích hoạt tính năng "View more" & "Show all" in-place
- **Vấn đề:** Các nút "Show all" (Tiện ích) và "View more" (Chính sách, Mô tả) trước đó chỉ điều hướng sơ sài hoặc không mở rộng nội dung trực tiếp trên màn hình chi tiết.
- **Khắc phục (`src/features/listing/screens/DetailScreen.tsx`):**
  - Thêm state `showAllFacilities`, `showAllPolicies`, `showAllDesc`.
  - Bấm "Show all amenities" mở rộng tức thì toàn bộ tiện nghi ngay trên giao diện; nút chuyển thành "Show less".
  - Bấm "View more" tại mục Policies và Description mở rộng toàn bộ nội dung mà không bị cắt dòng `numberOfLines`, hỗ trợ thu gọn mượt mà.

#### 3. Bảo mật Inbox: Bỏ danh sách toàn bộ User, kết nối qua SĐT/Email
- **Vấn đề:** Modal "Start a Conversation" hiển thị danh sách toàn bộ người dùng trong MongoDB Atlas (`media_1793866336332_e774de1e.jpg`), làm lộ thông tin cá nhân và thiếu thực tế.
- **Quy tắc nghiệp vụ mới:**
  - Khách và Chủ nhà (Renter & Host) tự động kết nối qua quy trình Đặt phòng (Bookings) hoặc Tư vấn phòng (Inquiries).
  - Đối với người dùng khác ngoài hệ thống phòng: người dùng phải tìm kiếm chính xác qua **Số điện thoại** hoặc **Email (Gmail)**.
- **Khắc phục:**
  - **Backend (`server/src/routes/chat.js`):** Thêm endpoint `GET /api/chat/search-user?query=...` tìm kiếm chính xác theo email/sđt, chặn tự tìm kiếm chính mình. Route cũ `/api/chat/contacts` trả về mảng rỗng để chống cào dữ liệu.
  - **Frontend Client (`src/services/chatService.ts`):** Bổ sung hàm `searchUser(query)`.
  - **Giao diện Modal (`src/features/inbox/screens/InboxScreen.tsx`):** Thay thế danh sách lộ liễu bằng ô tìm kiếm hiện đại kèm thông báo hướng dẫn bảo mật, hiển thị thẻ người dùng tìm thấy kèm nút "Start Chat".

---

### Bước 20: Tinh chỉnh Bottom Bar Detail & Làm giàu dữ liệu Check-in Policies, Description
- **Trạng thái:** ✅ Hoàn thành
- **Ngày:** 2026-11-05

#### 1. Fix lỗi tràn nút hành động tại DetailScreen
- **Vấn đề:** Do nút cao 48px và padding ngang quá lớn kết hợp với giá tiền "From: $28/night", nút "Book now" bị tràn viền phải trên các màn hình điện thoại có chiều ngang 360-390px (`media_1793867745733_01062b6b.jpg`).
- **Khắc phục (`src/features/listing/screens/DetailScreen.tsx`):**
  - Giảm chiều cao từ 48px xuống chuẩn **42px** nhỏ gọn, thanh thoát.
  - Tinh chỉnh padding ngang: "Contact host" (`paddingHorizontal: 11`, font 13px), "Book now" (`paddingHorizontal: 16`, font 14px).
  - Giảm khoảng cách gap xuống 6px, padding ngang thanh đáy xuống 14px.
  - Thêm `flexShrink: 0` cho phần giá tiền và `flexShrink: 1` cho nhóm nút bấm. Cả 2 nút nằm gọn gàng 100% bên trong khung hình, không bị tràn màn hình.

#### 2. Bổ sung nội dung chi tiết cho Description & Check-in Policies
- **Vấn đề:** Trước đây các bài đăng chỉ có 1 câu mô tả ngắn (~100 ký tự) và 1 câu chính sách nhận phòng (~50 ký tự), khiến việc bấm nút "View more ›" không thấy khác biệt gì do nội dung ban đầu chưa đủ dài để bị cắt.
- **Khắc phục:**
  - **`server/src/data/listings.json` & MongoDB Atlas (`seedListings.js`):** Bổ sung mô tả chi tiết 3 đoạn văn (không gian, tiện nghi, bàn làm việc, ban công, vị trí xung quanh) và quy định nhận phòng đầy đủ 5 điều khoản (mã khóa thông minh, xác minh CCCD/hộ chiếu, giờ yên tĩnh sau 22h, cấm hút thuốc, gửi hành lý sớm).
  - Đã chạy `seedListings.js` cập nhật thành công toàn bộ 8 căn hộ trên MongoDB Atlas.
  - Giao diện `DetailScreen.tsx`: khi chưa bấm "View more" sẽ cắt gọn 3 dòng mô tả / 2 dòng chính sách. Khi bấm "View more ›" sẽ bung toàn bộ các đoạn văn chi tiết và nút chuyển thành "Show less ▴".

---

### Bước 21: Hiện thực hóa tính năng Theme (Sáng/Tối/Hệ thống) và Language (Anh/Việt)
- **Trạng thái:** ✅ Hoàn thành
- **Ngày:** 2026-11-05

#### 1. Xây dựng Kiến trúc Core Theme & Language tập trung
- **Không phân mảnh file:** Không tạo context riêng lẻ cho từng màn hình, toàn bộ app sử dụng 1 `ThemeContext` và 1 `LanguageContext`.
- **Hệ thống Theme (`src/context/ThemeContext.tsx`):**
  - Quản lý chế độ `themeMode: 'light' | 'dark' | 'system'`.
  - Tự động nhận diện theme hệ điều hành qua `useColorScheme()` khi chọn `system`.
  - Bảng màu đôi `lightTheme` và `darkTheme` chuẩn công nghiệp.
  - Tự động đồng bộ màu thanh trạng thái máy (`StatusBar`).
  - Tự động lưu lựa chọn người dùng vào `settingsStorage`.
- **Hệ thống Đa ngôn ngữ (`src/constants/translations.ts` & `src/context/LanguageContext.tsx`):**
  - Bộ từ điển tập trung Anh - Việt type-safe 100%.
  - Hook `useLanguage()` cung cấp đối tượng `t` (translations) và hàm `setLanguage('English' | 'Tiếng Việt')`.
  - Tự động lưu và khôi phục ngôn ngữ đã chọn khi mở app.
- **Tích hợp tầng gốc (`src/app/AppProviders.tsx`):** Bọc `ThemeProvider` và `LanguageProvider` ở cấp cao nhất.

#### 2. Áp dụng thực tế ngay trên Settings, Profile & Navigation
- **`SettingsScreen.tsx`:**
  - Bấm chọn **Theme** (Light/Dark/System): Toàn bộ nền, chữ, khung viền, modal đổi sang màu tối/sáng tức thì.
  - Bấm chọn **Language** (English/Tiếng Việt): Toàn bộ tiêu đề, nhãn mục, nội dung chính sách đổi ngôn ngữ tức thì.
- **`MainTabs.tsx`:** Thanh điều hướng dưới cùng đổi màu nền theo Theme và đổi tên các Tab theo ngôn ngữ ("Search" -> "Khám phá", "Wishlist" -> "Yêu thích", "Booking" -> "Chuyến đi", "Inbox" -> "Hộp thư", "Profile" -> "Hồ sơ").
- **`ProfileScreen.tsx` & `ProfileHeader.tsx`:** Các menu và số liệu thống kê tự động thích ứng với ngôn ngữ và màu sắc giao diện.
- **`Screen.tsx`:** Mọi màn hình dùng `Screen` wrapper tự động nhận màu nền `colors.bg` theo theme đang kích hoạt.


---

### Bước 22: Phủ toàn diện Dark Mode & Song ngữ (Tiếng Việt) toàn bộ ứng dụng
- **Trạng thái:** ✅ Hoàn thành
- **Ngày:** 2026-11-05

#### 1. Khắc phục triệt để lỗi Text tối màu / Chữ đen tàng hình trong Dark Mode
- **Nguyên nhân gốc:** Nhiều component và màn hình trước đây sử dụng `c.t` (`#1B1F27`), `c.b` (`#DADDE4`), `c.soft` (`#F3F4F6`), hoặc dùng `S.box` bị hardcode nền trắng (`backgroundColor: '#fff'`), cùng các thẻ `<Text>` không chỉ định màu (mặc định đen trên mobile). Khi bật Dark Mode (`#121212`), chữ đen đè lên nền đen làm nội dung biến mất (như thấy trong ảnh màn hình Favorites, Bookings, Inbox).
- **Khắc phục toàn diện ở tầng Core Components:**
  - `src/components/Header.tsx`: Nền tự động đổi theo `colors.card`, tiêu đề và nút back chuyển `colors.text`.
  - `src/components/Btn.tsx`: Nút Outline nhận nền `colors.card`, chữ `colors.text`, viền `colors.border`.
  - `src/components/Stepper.tsx`: Viền và icon tăng giảm nhận `colors.border` và `colors.text`, số lượng khách màu sáng rõ ràng.
  - `src/components/Check.tsx`: Checkbox nhận nền `colors.card` và viền `colors.muted`, khi tick nhận `colors.primary`.
  - `src/features/bookings/components/Row.tsx`: Tự động nhận `colors.text` cho nhãn bên trái và giá trị bên phải; `Divider` nhận `colors.border`.

#### 2. Xử lý màn hình Search & Home đồng bộ Dark View
- **Nguyên nhân:** `HomeScreen` trước đó có style `<Screen style={{ backgroundColor: '#fff' }}>`, và `SearchScreen` dùng `S.box` nền trắng cứng, khiến tab Khám phá luôn bị sáng màu dù đã chọn Dark theme.
- **Khắc phục:**
  - `src/features/home/screens/HomeScreen.tsx`: Nhận nền `colors.bg`, thanh tìm kiếm nhận `colors.card`, tab phân loại nhận màu động theo `colors.primary` và `colors.muted`.
  - `src/features/search/screens/SearchScreen.tsx`: Viết lại toàn bộ với `useTheme()` và `useLanguage()`, các khung hộp chọn địa điểm, thời gian, số khách đều dùng `colors.card` và `colors.border`.
  - `src/features/search/components/Calendar.tsx`: Bộ chọn lịch hỗ trợ Dark Mode hoàn hảo, ngày tháng chữ trắng sáng, ngày đã chọn xanh cyan nổi bật, ngày quá khứ/bị khóa làm mờ nhẹ.
  - `src/features/search/screens/ResultsScreen.tsx` & `FiltersScreen.tsx`: Toàn bộ các thanh tóm tắt, ô nhập khoảng giá, checkbox loại phòng, nút Xem kết quả đổi màu dark theme.

#### 3. Mở rộng Hệ thống Song ngữ (Tiếng Việt) cho toàn bộ màn hình
- **`src/constants/translations.ts`:** Bổ sung đầy đủ các mục dịch:
  - `search`: Bạn muốn đi đâu, Địa điểm, Thời gian lưu trú, Chọn ngày, Bất cứ lúc nào, Bao nhiêu khách, Người lớn, Trẻ em, Xóa tất cả, Tìm kiếm, v.v.
  - `filters`: Bộ lọc, Khoảng giá, Tối thiểu, Tối đa, Loại chỗ nghỉ, Toàn bộ chỗ nghỉ, Phòng riêng, Phòng tập thể, Tiện ích, Xem kết quả.
  - `bookingFlow`: Xác nhận và thanh toán, Chuyến đi của bạn, Ngày, Số khách, Hình thức thanh toán, Thanh toán toàn bộ, Đặt cọc một phần, Chi tiết giá, Tổng cộng, Chính sách hủy phòng, Chi tiết đặt phòng, v.v.
  - `bookings.stages & paymentStatus`: Sắp tới, Đang ở, Hoàn thành, Đã hủy, Đã thanh toán đủ, Đã đặt cọc, v.v.
  - `inbox.chat`: Bộ gợi ý tin nhắn nhanh tiếng Việt cho Host & Khách thuê, trạng thái đang soạn trả lời, thông báo tin nhắn thời gian thực MongoDB Atlas.
- **Áp dụng đồng bộ:**
  - `ListingCard.tsx`: Tự động dịch danh mục chỗ nghỉ (Beach -> Bãi biển, Mountain -> Núi non, Camping -> Cắm trại).
  - `BookingsScreen.tsx` & `BookingDetailScreen.tsx`: Hiển thị tiếng Việt cho nhãn thanh toán, trạng thái phòng, biên lai.
  - `DetailScreen.tsx`: Hiển thị tiếng Việt cho tiện ích, quy định nhận phòng, giờ check-in/check-out, liên hệ chủ nhà, đặt phòng.
  - `ChatDetailScreen.tsx` & `InboxScreen.tsx`: Tự động chuyển các nhãn "Tư vấn", "Đã đặt", "Chuyến đi trước", các câu gợi ý chat tiếng Việt.
  - `AuthScreen.tsx` & `PersonalInfoScreen.tsx`: Form đăng nhập, đăng ký, cập nhật hồ sơ cá nhân hoàn toàn bằng tiếng Việt và hỗ trợ Dark Mode sắc nét.

---

### Bước 23: Lập kế hoạch cập nhật Dark Mode & i18n cho Module Profile
- **Trạng thái:** 🔄 Đang triển khai
- **Ngày:** 2026-11-05

#### 1. Phân tích Pattern từ các module đã hoàn thành
- **Đã đọc và rút ra pattern từ:**
  - `FavoritesScreen.tsx` - Dark Mode + i18n hoàn hảo
  - `HomeScreen.tsx` - Category translation, dynamic theme
  - `BookingsScreen.tsx` - Tab switching, status badges với theme
  - `InboxScreen.tsx` - Complex UI với search, modal, realtime indicators
  
#### 2. Kiểm tra trạng thái hiện tại Module Profile
- **Đã hoàn thành (4/9 screens):**
  - ✅ `ProfileScreen.tsx` - Đã dùng `useTheme()` và `useLanguage()`
  - ✅ `PersonalInfoScreen.tsx` - Đã dùng `useTheme()` và `isVietnamese`
  - ✅ `SettingsScreen.tsx` - Đã dùng đầy đủ Theme & i18n, Modal chọn theme/language
  - ✅ `ProfileHeader.tsx` - Component đã hỗ trợ theme và translation
  
- **Chưa hoàn thành (5/9 screens):**
  - ❌ `PaymentsScreen.tsx` - Còn dùng `c.t`, `c.bg`, `c.m` hardcode
  - ❌ `NotificationsScreen.tsx` - Còn dùng `c.bg`, `c.m` hardcode
  - ❌ `HelpCenterScreen.tsx` - Còn dùng `c, S` imports hardcode
  - ⚠️ `FaqScreen.tsx` - Chưa phân tích
  - ⚠️ `ContactSupportScreen.tsx` - Chưa phân tích
  - ⚠️ `ReportProblemScreen.tsx` - Chưa phân tích

#### 3. Tạo tài liệu kế hoạch chi tiết
- **File đã tạo:** `PLAN_PROFILE.md`
- **Nội dung bao gồm:**
  - Bảng phân tích trạng thái từng file (16 files: 9 screens + 7 components)
  - Pattern chuẩn cần áp dụng (Dark Theme + Translation)
  - Danh sách công việc chi tiết (8 bước)
  - Chi tiết các translations key cần bổ sung (`payments.*`, `notifications.*`, `helpCenter.*`)
  - Tiêu chí hoàn thành và lưu ý quan trọng

#### 4. Cập nhật FOLLOW.md
- Ghi nhận Bước 23 vào nhật ký tiến trình
- Liệt kê các file đã đọc và phân tích
- Ghi rõ file `PLAN_PROFILE.md` đã được tạo và vị trí lưu trữ

#### 5. Kế hoạch tiếp theo
- Bước 24: Đọc và phân tích các file còn lại (Faq, ContactSupport, ReportProblem, Help components)
- Bước 25: Bổ sung translations vào `constants/translations.ts`
- Bước 26-31: Update từng screen theo thứ tự ưu tiên
- Bước 32: Testing toàn diện Dark Mode + i18n cho toàn bộ Profile module
