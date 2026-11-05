# KẾ HOẠCH & TIẾN ĐỘ HỆ THỐNG PROFILE & USER MANAGEMENT (PROFILE.md)

Tài liệu này xác định kiến trúc, kịch bản nghiệp vụ, mô hình dữ liệu và kết quả hoàn thiện các tính năng thuộc phân hệ **Profile (Hồ sơ người dùng)**, bao gồm: Quản lý thông tin cá nhân, Danh sách yêu thích (Favorites) đồng bộ MongoDB Atlas, Lịch sử thanh toán & Hóa đơn (Payments & Invoices), Cấu hình thông báo (Notifications) và Cài đặt hệ thống (Settings).

---

## 🎯 1. Nguyên tắc triển khai & Ranh giới trách nhiệm (Boundaries)

- **Quyền hạn phụ trách:** Phân hệ **Profile**, **User / Auth** và **Favorites**.
- **Quy tắc tuyệt đối (Strict Constraints):**
  - **CHỈ CHỈNH SỬA CODE TRONG PHẠM VI PROFILE & USER/FAVORITES.**
  - **TUYỆT ĐỐI KHÔNG ĐỤNG CODE CỦA DEV KHÁC:** Không can thiệp hoặc thay đổi logic đặt phòng, huỷ phòng, tính tiền trong `src/features/booking/`, `src/features/bookings/`, `src/features/listing/` hay `server/src/routes/bookings.js`.
  - Mọi dữ liệu phát sinh (Favorites, Profile Updates) phải được lưu trữ bền vững trên **MongoDB Atlas**, không dùng state RAM tạm bợ.

---

## 👥 2. Tài khoản thử nghiệm (Test Accounts trên MongoDB Atlas)

| Vai trò | Tên hiển thị | Email | Mật khẩu | Số điện thoại | Kịch bản kiểm thử Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Khách hàng (Renter)** | **Sơn** | `nguyensonn2k5@gmail.com` | `password123` | `0833756579` | Thả tim lưu vào DB, xem số đếm favorites trên Profile, xem danh sách hóa đơn thanh toán & biên lai từ các booking đã đặt. |
| **Chủ nhà (Host)** | **Jinny Oslin** | `jinny@gmail.com` | `password123` | `0901234567` | Chỉnh sửa tên & SĐT, xem thông tin tài khoản và cấu hình hệ thống. |

---

## 🏗️ 3. Kiến trúc hệ thống Profile

### 3.1. Backend (`server/`)
```
server/
├── src/
│   ├── models/
│   │   └── User.js               # Bổ sung trường favorites: [{ type: String }] vào Schema & toPublic()
│   └── routes/
│       └── auth.js               # API: PATCH /me (Update Info), POST /favorites/:id (Toggle Bookmark DB)
```

### 3.2. Frontend Client (`src/`)
```
src/
├── services/
│   ├── authService.ts            # Đăng nhập, đăng ký, me (khôi phục session)
│   ├── userService.ts            # getProfile, updateProfile, toggleFavorite (đồng bộ DB)
│   └── settingsStorage.ts        # Lưu cấu hình Notifications và Preferences bền vững (Web & Native)
├── store/
│   ├── types.ts                  # Interface User (favorites?: string[])
│   └── AppContext.tsx            # Đồng bộ favs với MongoDB, tự động nạp khi login, dọn khi logout
└── features/profile/
    ├── components/
    │   ├── ProfileHeader.tsx     # Hiển thị Avatar, Tên, Email, SĐT, số lượng favorites & bookings thật
    │   ├── MenuItem.tsx          # Các mục điều hướng menu
    │   └── SettingRow.tsx        # Toggle & select setting row
    └── screens/
        ├── ProfileScreen.tsx     # Màn hình chính Profile (Header + Menu + Logout)
        ├── PersonalInfoScreen.tsx# Chỉnh sửa Tên & SĐT thật (validate chuẩn, lưu PATCH /auth/me)
        ├── PaymentsScreen.tsx    # Lịch sử thanh toán & biên lai hóa đơn thật từ Bookings + Quản lý thẻ
        ├── NotificationsScreen.tsx# Cấu hình bật/tắt nhận thông báo (lưu persistent)
        ├── SettingsScreen.tsx    # Cài đặt giao diện, ngôn ngữ & Chính sách bảo mật
        └── HelpCenterScreen.tsx  # Trung tâm hỗ trợ khách hàng
```

---

## 📋 4. Bảng phân rã công việc (Task List & Milestones)

| STT | Hạng mục | Chi tiết kỹ thuật | Trạng thái |
| :---: | :--- | :--- | :--- :---: |
| **1** | **Khắc phục lỗi hiển thị 2 Header** | Loại bỏ `<Header>` thừa ở 5 màn hình con của Profile (Commit `20e72b0`) | ✅ Hoàn thành |
| **2** | **Hoàn thiện `PersonalInfoScreen.tsx`** | Fetch profile thật từ `/auth/me`, validate Tên (1-80) & SĐT (8-15), lưu qua PATCH API | ✅ Hoàn thành |
| **3** | **Lưu trữ Favorites trên MongoDB** | Thêm `favorites` vào `User.js`, tạo endpoint `POST /auth/favorites/:id`, đồng bộ qua `AppContext` | ✅ Hoàn thành |
| **4** | **Nâng cấp `PaymentsScreen.tsx`** | Hiển thị lịch sử giao dịch & hóa đơn thực tế từ `bookings` + Modal biên lai chi tiết | ✅ Hoàn thành |
| **5** | **Hoàn thiện `NotificationsScreen.tsx`**| State toggle lưu trữ cấu hình thông báo bền vững qua `settingsStorage` | ✅ Hoàn thành |
| **6** | **Hoàn thiện `SettingsScreen.tsx`** | Cài đặt ngôn ngữ, theme và xem Chính sách bảo mật (Privacy Policy) | ✅ Hoàn thành |

---

## 🔄 5. Nhật ký chi tiết tiến độ triển khai

### Bước 1 & 2: Fix 2 Header & Hoàn thiện Personal Info
- Đã giải quyết triệt để lỗi 2 Header xếp chồng lên nhau do React Navigation Native Stack đã có header mặc định.
- `PersonalInfoScreen.tsx` đã kết nối API thật, cập nhật Tên và Số điện thoại ngay lập tức vào MongoDB Atlas và phản chiếu lên `ProfileHeader`.

### Bước 3: Đồng bộ Favorites với Database MongoDB Atlas
- Cập nhật `server/src/models/User.js`: Bổ sung trường `favorites: [{ type: String }]`.
- Cập nhật `server/src/routes/auth.js`: Thêm route `POST /api/auth/favorites/:id` để toggle ID chỗ nghỉ vào MongoDB Atlas.
- Cập nhật `src/services/userService.ts`: Thêm hàm `toggleFavorite(listingId, token)`.
- Cập nhật `src/store/AppContext.tsx`:
  - Khi login/restore: nạp danh sách `favorites` từ DB vào state.
  - Khi thả tim: Optimistic update giao diện ngay tức thì + gọi API lưu MongoDB Atlas.
  - Khi đăng xuất: Dọn sạch danh sách favorites.
- Kiểm thử độc lập qua script `testFavorites.js` thành công 100%.

### Bước 4: Nâng cấp PaymentsScreen (Hóa đơn & Lịch sử thanh toán thật)
- Tích hợp 2 Tab điều hướng:
  1. **Invoices & Receipts:** Liệt kê các biên lai thanh toán từ dữ liệu `bookings` thật của người dùng (Tên chỗ nghỉ, ảnh, ngày thanh toán, mã Ref, số tiền đã trả, trạng thái `Paid in full` hoặc `Partial paid`).
  2. **Receipt Modal:** Bấm vào bất kỳ hóa đơn nào sẽ mở modal hiển thị chi tiết: Đơn giá x số đêm, danh sách phụ phí, tổng tiền, số tiền đã cọc/trả, số dư còn lại cần thanh toán khi nhận phòng.
  3. **Payment Methods:** Quản lý thẻ đã lưu, chuyển đổi thẻ mặc định và thêm thẻ mới.

### Bước 5 & 6: Hoàn thiện NotificationsScreen & SettingsScreen
- Xây dựng `src/services/settingsStorage.ts` lưu trữ cấu hình đa nền tảng (Web & Mobile).
- `NotificationsScreen.tsx`: Hỗ trợ bật/tắt nhận thông báo Booking updates, Messages & Inquiries, Promotions & Deals lưu trữ vĩnh viễn.
- `SettingsScreen.tsx`: Hỗ trợ đổi Theme (Light, Dark, System) và Ngôn ngữ (English, Tiếng Việt) kèm Modal xem chi tiết Chính sách bảo mật dữ liệu.

### Bước 7: Kích hoạt Theme (Light/Dark/System) & Đa ngôn ngữ (Anh/Việt) thực tế
- Xây dựng Core Provider tập trung:
  - `src/constants/translations.ts`: Bộ từ điển Anh - Việt type-safe 100%.
  - `src/context/LanguageContext.tsx`: Cung cấp `useLanguage()`, hàm `setLanguage()`, biến `t` (translations) và lưu `settingsStorage`.
  - `src/context/ThemeContext.tsx`: Cung cấp `useTheme()`, hàm `setThemeMode()`, bảng màu `colors` (Light/Dark) và tự động nhận diện chế độ hệ thống qua `useColorScheme()`.
- Tích hợp toàn diện:
  - `src/app/AppProviders.tsx`: Đăng ký `ThemeProvider` và `LanguageProvider` ở cấp gốc.
  - `SettingsScreen.tsx`: Thay đổi giao diện Sáng/Tối và đổi ngôn ngữ Anh/Việt tức thì trên UI.
  - `MainTabs.tsx`: Tự động dịch tên các Tab ("Khám phá", "Yêu thích", "Chuyến đi", "Hộp thư", "Hồ sơ") và đổi màu thanh Tab Bar theo theme.
  - `ProfileScreen.tsx` & `ProfileHeader.tsx`: Cập nhật menu và thông tin theo ngôn ngữ và màu sắc theme.
  - `Screen.tsx`: Đảm bảo nền mọi màn hình tự động ăn theo theme được chọn.
