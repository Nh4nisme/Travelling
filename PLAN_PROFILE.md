# KẾ HOẠCH CẬP NHẬT DARK MODE & I18N CHO MODULE PROFILE (PLAN_PROFILE.md)

Tài liệu này ghi lại kế hoạch chi tiết để áp dụng Dark Theme và Đa ngôn ngữ (Tiếng Việt) cho toàn bộ các màn hình và components thuộc module **Profile**, dựa trên pattern đã hoàn thiện từ các module **Search**, **Favorites**, **Bookings**, và **Inbox**.

---

## 🎯 Mục tiêu

Đảm bảo 100% các màn hình trong module Profile:
1. **Hỗ trợ Dark Mode hoàn hảo** - Không có text tối trên nền tối, không có hardcode colors
2. **Hỗ trợ Song ngữ (English/Tiếng Việt)** - Tất cả labels, titles, buttons, messages đều dịch đầy đủ
3. **Tương thích với ThemeContext và LanguageContext** - Sử dụng hooks `useTheme()` và `useLanguage()`

---

## 📋 Bảng phân tích trạng thái hiện tại

| STT | File | Dark Mode | Translation | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **A. SCREENS** |
| 1 | `ProfileScreen.tsx` | ✅ Hoàn thành | ✅ Hoàn thành | Đã dùng `useTheme()` và `useLanguage()` |
| 2 | `PersonalInfoScreen.tsx` | ✅ Hoàn thành | ✅ Hoàn thành | Đã dùng `useTheme()`, `isVietnamese` |
| 3 | `PaymentsScreen.tsx` | ❌ Cần update | ❌ Cần update | Còn dùng `c.t`, `c.bg`, `c.m` hardcode |
| 4 | `NotificationsScreen.tsx` | ❌ Cần update | ❌ Cần update | Còn dùng `c.bg`, `c.m` hardcode |
| 5 | `HelpCenterScreen.tsx` | ❌ Cần update | ❌ Cần update | Còn dùng `c, S` hardcode |
| 6 | `FaqScreen.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 7 | `ContactSupportScreen.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 8 | `ReportProblemScreen.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 9 | `SettingsScreen.tsx` | ✅ Hoàn thành | ✅ Hoàn thành | Đã dùng đầy đủ Theme & i18n |
| **B. COMPONENTS** |
| 10 | `ProfileHeader.tsx` | ✅ Hoàn thành | ✅ Hoàn thành | Đã dùng `useTheme()` và `useLanguage()` |
| 11 | `MenuItem.tsx` | ✅ Hoàn thành | N/A | Đã dùng `useTheme()`, nhận title từ parent |
| 12 | `SettingRow.tsx` | ✅ Hoàn thành | N/A | Đã dùng `useTheme()`, nhận label từ parent |
| 13 | `HelpSearchBar.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 14 | `TopicCard.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 15 | `FaqAccordionItem.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |
| 16 | `ContactOption.tsx` | ⚠️ Cần kiểm tra | ⚠️ Cần kiểm tra | Chưa đọc code |

---

## 🔧 Pattern chuẩn cần áp dụng

### Pattern 1: Dark Theme
```typescript
import { useTheme } from '@/context/ThemeContext';

export function MyScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Title</Text>
      <Text style={{ color: colors.muted }}>Subtitle</Text>
      <View style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        {/* Card content */}
      </View>
    </View>
  );
}
```

**Thay thế:**
- ❌ `c.t` / `'#1B1F27'` → ✅ `colors.text`
- ❌ `c.m` / `'#8A8F9C'` → ✅ `colors.muted`
- ❌ `c.bg` / `'#FFFFFF'` → ✅ `colors.bg`
- ❌ `c.b` / `'#DADDE4'` → ✅ `colors.border`
- ❌ `c.soft` / `'#F3F4F6'` → ✅ `colors.soft`
- ❌ `'#00BCD4'` → ✅ `colors.primary`

### Pattern 2: Translation (i18n)
```typescript
import { useLanguage } from '@/context/LanguageContext';

export function MyScreen() {
  const { t, isVietnamese } = useLanguage();
  
  return (
    <View>
      <Text>{t.profile.title}</Text>
      <Button title={t.common.save} />
      <Text>
        {isVietnamese 
          ? 'Thông báo bằng tiếng Việt'
          : 'English notification'}
      </Text>
    </View>
  );
}
```

---

## 📝 Danh sách công việc chi tiết

### Bước 1: Đọc và phân tích các file còn lại
- [ ] Đọc `FaqScreen.tsx`
- [ ] Đọc `ContactSupportScreen.tsx`
- [ ] Đọc `ReportProblemScreen.tsx`
- [ ] Đọc `HelpSearchBar.tsx`
- [ ] Đọc `TopicCard.tsx`
- [ ] Đọc `FaqAccordionItem.tsx`
- [ ] Đọc `ContactOption.tsx`

### Bước 2: Bổ sung translations vào `constants/translations.ts`

Cần thêm các key mới cho:
- **Payments Screen:**
  - Tab titles: "Invoices & Receipts", "Payment Methods"
  - Empty states, modal titles, button labels
  - Card brand names, validation messages
- **Notifications Screen:**
  - Setting labels: "Booking updates", "Messages & Inquiries", "Promotions & Deals"
  - Description text
- **Help Center:**
  - Search placeholder, section titles
  - "How can we help?", "Contact Support", "Report a Problem"
  - FAQ categories, questions, answers

### Bước 3: Update PaymentsScreen.tsx
- [ ] Import `useTheme()` và `useLanguage()`
- [ ] Thay thế tất cả `c.t`, `c.bg`, `c.m`, `c.b` bằng `colors.*`
- [ ] Thay thế hardcode text bằng `t.payments.*`
- [ ] Test Dark Mode: kiểm tra text, background, borders
- [ ] Test i18n: chuyển đổi English/Tiếng Việt

### Bước 4: Update NotificationsScreen.tsx
- [ ] Import `useTheme()` và `useLanguage()`
- [ ] Thay thế `c.bg`, `c.m` bằng `colors.*`
- [ ] Thay thế hardcode text bằng `t.notifications.*`
- [ ] Test Dark Mode và i18n

### Bước 5: Update HelpCenterScreen.tsx
- [ ] Import `useTheme()` và `useLanguage()`
- [ ] Thay thế `c, S` imports bằng dynamic colors
- [ ] Thay thế hardcode text bằng `t.helpCenter.*`
- [ ] Test Dark Mode và i18n

### Bước 6: Update các screens còn lại
- [ ] FaqScreen.tsx
- [ ] ContactSupportScreen.tsx
- [ ] ReportProblemScreen.tsx

### Bước 7: Update các components còn lại
- [ ] HelpSearchBar.tsx
- [ ] TopicCard.tsx
- [ ] FaqAccordionItem.tsx
- [ ] ContactOption.tsx

### Bước 8: Testing toàn diện
- [ ] Test Dark Mode: mở từng màn hình Profile, kiểm tra không có text tối/nền tối
- [ ] Test Light Mode: kiểm tra vẫn hoạt động bình thường
- [ ] Test System Mode: đổi theme hệ thống, app tự động thích ứng
- [ ] Test i18n: chuyển đổi English ↔ Tiếng Việt mượt mà
- [ ] Test trên iOS và Android
- [ ] Test trên thiết bị thật và simulator

---

## 🎨 Chi tiết các translations cần bổ sung

### payments (English)
```typescript
payments: {
  title: 'Payments',
  tabInvoices: 'Invoices & Receipts',
  tabMethods: 'Payment Methods',
  emptyInvoices: 'No payment history yet.',
  emptyMethods: 'No payment methods saved.',
  addCard: 'Add Card',
  cardNumber: 'Card Number',
  cardHolder: 'Cardholder Name',
  expiry: 'Expiry (MM/YY)',
  cvv: 'CVV',
  setDefault: 'Set as default',
  saveCard: 'Save Card',
  deleteCard: 'Delete Card',
  confirmDelete: 'Are you sure you want to delete this card?',
  cancel: 'Cancel',
  delete: 'Delete',
  receiptTitle: 'Receipt Details',
  bookingRef: 'Ref',
  paidOn: 'Paid on',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  nights: 'nights',
  guests: 'guests',
  priceBreakdown: 'Price Breakdown',
  basePrice: 'Base price',
  serviceFee: 'Service fee',
  tax: 'Tax',
  total: 'Total',
  amountPaid: 'Amount Paid',
  balanceDue: 'Balance Due',
  paymentMethod: 'Payment Method',
  testCard: 'Quick Test Card',
}
```

### payments (Tiếng Việt)
```typescript
payments: {
  title: 'Thanh toán',
  tabInvoices: 'Hóa đơn & Biên lai',
  tabMethods: 'Phương thức thanh toán',
  emptyInvoices: 'Chưa có lịch sử thanh toán.',
  emptyMethods: 'Chưa có phương thức thanh toán nào.',
  addCard: 'Thêm thẻ',
  cardNumber: 'Số thẻ',
  cardHolder: 'Tên chủ thẻ',
  expiry: 'Hạn thẻ (MM/YY)',
  cvv: 'Mã CVV',
  setDefault: 'Đặt làm mặc định',
  saveCard: 'Lưu thẻ',
  deleteCard: 'Xóa thẻ',
  confirmDelete: 'Bạn có chắc muốn xóa thẻ này?',
  cancel: 'Hủy',
  delete: 'Xóa',
  receiptTitle: 'Chi tiết biên lai',
  bookingRef: 'Mã',
  paidOn: 'Thanh toán vào',
  checkIn: 'Nhận phòng',
  checkOut: 'Trả phòng',
  nights: 'đêm',
  guests: 'khách',
  priceBreakdown: 'Chi tiết giá',
  basePrice: 'Giá cơ bản',
  serviceFee: 'Phí dịch vụ',
  tax: 'Thuế',
  total: 'Tổng cộng',
  amountPaid: 'Đã thanh toán',
  balanceDue: 'Còn lại',
  paymentMethod: 'Phương thức',
  testCard: 'Thẻ test nhanh',
}
```

### notifications (English & Tiếng Việt)
```typescript
notifications: {
  title: 'Notifications',
  subtitle: 'Choose the notifications you want to receive on this device.',
  bookingUpdates: 'Booking updates',
  messages: 'Messages & Inquiries',
  promotions: 'Promotions & Deals',
  description: 'Booking updates include check-in reminders, schedule changes, and host confirmations.',
}

notifications: {
  title: 'Thông báo',
  subtitle: 'Chọn các loại thông báo bạn muốn nhận trên thiết bị này.',
  bookingUpdates: 'Cập nhật đặt phòng',
  messages: 'Tin nhắn & Yêu cầu tư vấn',
  promotions: 'Khuyến mãi & Ưu đãi',
  description: 'Cập nhật đặt phòng bao gồm nhắc nhở nhận phòng, thay đổi lịch trình và xác nhận từ chủ nhà.',
}
```

### helpCenter (English & Tiếng Việt)
```typescript
helpCenter: {
  title: 'Help Center',
  searchPlaceholder: 'Search for help (e.g. refund, check-in)',
  howCanWeHelp: 'How can we help?',
  subtitle: 'Search our FAQs or get in touch with the Travelling team.',
  popularTopics: 'POPULAR TOPICS',
  browseTopics: 'BROWSE TOPICS',
  results: 'RESULT',
  seeAll: 'See all',
  noResults: 'No results for',
  tryDifferent: 'Try different keywords or contact our team.',
  contactSupport: 'Contact Support',
  reportProblem: 'Report a Problem',
}

helpCenter: {
  title: 'Trung tâm trợ giúp',
  searchPlaceholder: 'Tìm kiếm hỗ trợ (VD: hoàn tiền, nhận phòng)',
  howCanWeHelp: 'Chúng tôi có thể giúp gì?',
  subtitle: 'Tìm kiếm câu hỏi thường gặp hoặc liên hệ với đội ngũ Travelling.',
  popularTopics: 'CHỦ ĐỀ PHỔ BIẾN',
  browseTopics: 'DANH MỤC CHỦ ĐỀ',
  results: 'KẾT QUẢ',
  seeAll: 'Xem tất cả',
  noResults: 'Không có kết quả cho',
  tryDifferent: 'Thử từ khóa khác hoặc liên hệ đội ngũ hỗ trợ.',
  contactSupport: 'Liên hệ hỗ trợ',
  reportProblem: 'Báo cáo sự cố',
}
```

---

## ✅ Tiêu chí hoàn thành

Một màn hình được coi là hoàn thành khi:
1. ✅ Import `useTheme()` và/hoặc `useLanguage()` (nếu có text)
2. ✅ Không còn hardcode colors (`c.t`, `'#1B1F27'`, v.v.)
3. ✅ Tất cả `<Text>` đều có `color: colors.text` hoặc `colors.muted`
4. ✅ Tất cả containers có `backgroundColor: colors.bg` hoặc `colors.card`
5. ✅ Không còn hardcode text strings (trừ technical keys như API paths)
6. ✅ Test Dark Mode: không có text tối trên nền tối
7. ✅ Test Light Mode: vẫn hoạt động bình thường như cũ
8. ✅ Test i18n: chuyển đổi English ↔ Tiếng Việt mượt mà, không bị vỡ layout

---

## 📌 Lưu ý quan trọng

1. **Không phá vỡ logic nghiệp vụ:** Chỉ thay đổi UI/styling và text, không sửa logic xử lý API, validation, navigation.
2. **Không duplicate code:** Dùng chung `ThemeContext` và `LanguageContext`, không tạo context riêng lẻ.
3. **Kiểm tra kỹ before/after:** Screenshot màn hình trước và sau update để so sánh.
4. **Commit từng bước:** Mỗi screen/component hoàn thành thì commit riêng với message rõ ràng.
5. **Test trên thiết bị thật:** Dark Mode trên iOS/Android có thể khác với simulator.
