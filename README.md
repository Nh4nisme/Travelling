# Travelling App — Mobile Travel & Vacation Rental Platform

Ứng dụng di động tìm kiếm, đặt phòng nghỉ dưỡng du lịch và trò chuyện trực tuyến thời gian thực (Realtime Two-way Chat), tích hợp trợ lý du lịch AI thông minh (Google Gemini AI). Dự án xây dựng theo kiến trúc Full-Stack hiện đại: **Expo SDK 58 (React Native + TypeScript)** kết hợp **Node.js Express API**, **Socket.IO** và **MongoDB Atlas**.

---

## Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Mobile App)
- **Framework:** React Native, Expo SDK 58 (Hỗ trợ iOS, Android, Web).
- **Ngôn ngữ:** TypeScript.
- **Điều hướng:** `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.
- **Giao tiếp Realtime:** `socket.io-client` (Hybrid Polling + WebSocket).
- **Trợ lý Trí tuệ Nhân tạo (AI):** `@google/generative-ai` (Google Gemini Flash API).
- **Lưu trữ bảo mật:** `expo-secure-store` (Hardware-backed Keystore/Keychain).
- **Thông báo & Tài liệu:** `expo-notifications`, `expo-print`, `expo-sharing`.
- **Giao diện & Biểu tượng:** `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`, `react-native-svg`.

### Backend (REST API & Realtime Server)
- **Runtime & Framework:** Node.js, Express.js.
- **Cơ sở dữ liệu:** MongoDB Atlas Cloud với Mongoose ODM.
- **Realtime Engine:** Socket.IO (Room management, Typing events, Instant message broadcast).
- **Bảo mật & Xác thực:** JSON Web Token (JWT), `bcryptjs` (Băm mật khẩu và mã PIN thanh toán), `express-rate-limit`, `cors`.
- **Dịch vụ Email:** Nodemailer (Gửi mã OTP kích hoạt tài khoản qua Gmail SMTP).

---

## Các Tính Năng Nổi Bật (Key Features)

### 1. Xác thực & Bảo mật tài khoản (Auth)
- Đăng nhập, đăng ký tài khoản với xác minh mã OTP 6 số qua Email thực tế.
- Khôi phục và thay đổi mật khẩu an toàn.
- Quản lý phiên đăng nhập liên tục với JWT Token lưu trong SecureStore.

### 2. Khám phá & Đặt phòng (Home, Search & Booking)
- **Khám phá:** Duyệt căn hộ theo danh mục (Beachfront, Cabins, Mansions, Treehouses, v.v.), danh sách căn hộ nổi bật, đánh giá sao thật.
- **Tìm kiếm nâng cao:** Lọc theo địa điểm, chọn ngày check-in/check-out qua lịch trực quan, số lượng khách, khoảng giá và tiện nghi.
- **Chi tiết căn hộ:** Hình ảnh sắc nét, thông tin chủ nhà (Host), tiện ích phòng, chính sách hủy và tọa độ bản đồ.
- **Quy tắc đặt phòng:** Kiểm tra phòng trống, tính tổng tiền tự động kèm thuế phí.
- **Xuất hóa đơn PDF:** Xem lại chi tiết đặt phòng và xuất hóa đơn biên lai ra file PDF qua `expo-print` & `expo-sharing`.

### 3. Nhắn tin Realtime 2 Chiều (Realtime Chat)
- Trò chuyện trực tiếp tức thì giữa **Khách thuê (Renter)** và **Chủ nhà (Host)** qua Socket.IO (< 50ms).
- Tự động hiển thị thẻ căn hộ đã ghim (Pinned Listing Card) và gợi ý câu hỏi nhanh (Quick Chips).
- Hiệu ứng người đối diện đang soạn tin (Typing Indicator) kèm Debounce 2 giây.
- Cơ chế **Optimistic UI Update** giúp tin nhắn hiển thị ngay lập tức (0ms) trước khi lưu vào MongoDB.
- Tìm kiếm người dùng qua Số điện thoại hoặc Email để bắt đầu cuộc trò chuyện mới mà không lộ danh bạ.

### 4. Trợ lý Du lịch Ảo (Google Gemini AI)
- Tích hợp Gemini AI giải đáp mọi thắc mắc về lịch trình, gợi ý phòng nghỉ, tư vấn du lịch 24/7.
- Bong bóng chat AI di động nổi trên màn hình (Draggable Floating Bubble) tiện lợi.

### 5. Quản trị Cá nhân & Thanh toán (Profile & Payments)
- **Quản lý thẻ PCI-DSS:** Xác thực số thẻ bằng thuật toán Luhn Checksum (Mod 10), tự nhận diện Visa/Mastercard/JCB/Amex qua số BIN, tự động định dạng `XXXX XXXX XXXX XXXX`.
- **Mã PIN thanh toán 6 số (Payment PIN):** Bắt buộc xác thực khi thanh toán, mã hóa băm mật mã một chiều `bcryptjs`, hiệu ứng con trỏ nhấp nháy `react-native Animated`.
- **Cài đặt & Giao diện:** Hỗ trợ song ngữ **Tiếng Việt - English (US)** và đổi giao diện **Dark / Light Mode** tức thì.
- **Trung tâm trợ giúp:** Danh mục FAQ dạng Accordion có nút đánh giá hữu ích, gọi hotline 1-chạm (`tel:`) và gửi ticket báo cáo sự cố kèm mã đặt phòng.

---

## Cấu Trúc Thư Mục Dự Án (Project Structure)

```
Travelling/
├── App.tsx                     # Entry point khởi tạo App
├── index.ts                    # Đăng ký root component Expo
├── app.json                    # Cấu hình Expo App (SDK 58)
├── package.json                # Dependencies Frontend
├── .env.example                # File mẫu biến môi trường dùng chung
├── .env                        # File biến môi trường chính
│
├── src/                        # Mã nguồn ứng dụng di động
│   ├── app/                    # Navigation (RootNavigator, MainTabs, AppProviders)
│   ├── components/             # UI Components dùng chung (Btn, Header, Photo, ListingCard...)
│   ├── config/                 # Cấu hình biến môi trường client (env.ts)
│   ├── constants/              # Theme, màu sắc, từ điển đa ngôn ngữ (translations.ts)
│   ├── context/                # Contexts (ThemeContext, LanguageContext)
│   ├── data/                   # Mock data ảnh, reviews
│   ├── features/               # Các module chức năng độc lập:
│   │   ├── auth/               # Đăng nhập, đăng ký OTP, Splash
│   │   ├── home/               # Trang chủ khám phá
│   │   ├── search/             # Tìm kiếm, bộ lọc, lịch
│   │   ├── listing/            # Chi tiết phòng, đánh giá
│   │   ├── booking/            # Form đặt phòng
│   │   ├── bookings/           # Quản lý danh sách chuyến đi đã đặt
│   │   ├── favorites/          # Danh sách yêu thích (Wishlist)
│   │   ├── inbox/              # Hộp thư, phòng chat realtime Renter ↔ Host, AI
│   │   └── profile/            # Trang cá nhân, Payments, PIN, Đổi mật khẩu, Help Center
│   ├── services/               # Lớp gọi API & Socket (chatService, socketService, paymentService...)
│   ├── store/                  # Global state (AppContext, AppReducer)
│   └── utils/                  # Tiện ích (tính giá, date, format tiền tệ, dialog)
│
└── server/                     # Backend API & Realtime Server
    ├── package.json            # Dependencies Backend
    └── src/
        ├── index.js            # Khởi tạo Express, HTTP Server & Socket.IO
        ├── config/             # Kết nối MongoDB, nạp ENV
        ├── data/               # Dữ liệu listings mẫu (listings.json)
        ├── middleware/         # Middleware xác thực JWT (auth.js)
        ├── models/             # Mongoose Schemas (User, Listing, Booking, Conversation, Message...)
        ├── routes/             # REST API Routes (auth, listings, bookings, chat, payments, support)
        ├── services/           # Quy tắc đặt phòng (bookingRules), Email OTP (emailService)
        ├── test/               # Unit tests kiểm thử quy tắc đặt phòng (BR01 - BR07)
        └── seedAllHostsAndListings.js # Tự động tạo tài khoản host/khách và căn hộ mẫu
```

---

## ⚙️ Cài Đặt & Khởi Chạy (Installation & Setup)

### 1. Yêu cầu môi trường
- **Node.js** >= 20 (Khuyên dùng LTS).
- Trình quản lý gói **pnpm** (`npm install -g pnpm`).

### 2. Thiết lập Biến Môi Trường (.env)
Sao chép `.env.example` thành file `.env` ở thư mục gốc:
```bash
cp .env.example .env
```
Cấu hình các giá trị trong `.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/stayapp?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30d
PORT=4000

# Cấu hình gửi mail OTP (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password

# Cấu hình kết nối Mobile Client tới Backend
# Dùng localhost nếu chạy máy ảo iOS; dùng IP LAN (vd: 192.168.1.X) nếu chạy điện thoại thật / Expo Go
EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:4000

# Google Gemini API Key
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Cài đặt & Khởi động Backend Server
```bash
cd server
pnpm install

# Nạp dữ liệu căn hộ ban đầu vào MongoDB Atlas
pnpm seed:listings

# Khởi động Backend Server (PORT 4000)
pnpm dev
```
*(Server sẽ tự động đồng bộ tài khoản Host và liên kết các căn hộ khi khởi động).*

### 4. Cài đặt & Khởi động Mobile App (Frontend)
Mở một cửa sổ Terminal mới tại thư mục gốc của dự án:
```bash
# Cài đặt dependencies
pnpm install

# Khởi động ứng dụng
pnpm start
```

**Các chế độ chạy ứng dụng:**
- Nhấn `w` để mở trên trình duyệt Web.
- Nhấn `a` để mở trên Android Emulator (Android Studio).
- Nhấn `i` để mở trên iOS Simulator (Xcode trên macOS).
- Chạy với **Expo Go** trên điện thoại thật (cùng mạng Wi-Fi):
  ```bash
  pnpm start:go
  ```
  *(Lưu ý: Thay `localhost` trong `.env` thành địa chỉ IP Wi-Fi nội bộ của máy tính, ví dụ `http://192.168.1.50:4000`).*
