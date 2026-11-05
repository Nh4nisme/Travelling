# TÀI LIỆU QUẢN LÝ PHƯƠNG THỨC THANH TOÁN (PAYMENT.MD)

Tài liệu này ghi lại toàn bộ kiến trúc, tiêu chuẩn bảo mật, thuật toán xác thực thẻ, luồng dữ liệu (Data Flow) và tiến trình phát triển các phiên bản (Ver1, Ver2...) cho tính năng **Phương thức thanh toán (Payment Methods)** trong ứng dụng **Travelling**.

---

## 1. Tổng quan & Tiêu chuẩn Tuân thủ (Compliance)

### Tiêu chuẩn PCI-DSS (Payment Card Industry Data Security Standard)
Hệ thống tuân thủ nghiêm ngặt nguyên tắc cốt lõi của PCI-DSS Level 1:
1. **Không bao giờ lưu số thẻ đầy đủ (Full PAN - Primary Account Number)** vào cơ sở dữ liệu MongoDB Atlas.
2. **Không bao giờ lưu mã bảo mật CVV/CVC** vào cơ sở dữ liệu dưới bất kỳ hình thức nào.
3. Chỉ lưu **4 số cuối (`last4`)**, **nhãn hiệu thẻ (`brand`)**, **tháng/năm hết hạn (`exp`)** và **tên in trên thẻ (`cardHolderName`)** để người dùng nhận diện và quản lý.
4. Mọi dữ liệu nhạy cảm truyền qua mạng đều được mã hóa bằng HTTPS / SSL.

---

## 2. Cơ chế Xác thực Thẻ (Card Verification Engine)

Để ngăn chặn tuyệt đối việc người dùng nhập dữ liệu bừa bãi hoặc thẻ giả vào hệ thống, cả client và server đều áp dụng các tầng kiểm duyệt nghiêm ngặt:

### A. Thuật toán Luhn (Mod 10 Checksum)
- Thuật toán tiêu chuẩn quốc tế ISO/IEC 7812-1 được sử dụng bởi các tổ chức thẻ hàng đầu thế giới (Visa, Mastercard, Amex, JCB).
- **Nguyên lý hoạt động:**
  1. Duyệt từ chữ số cuối cùng (bên phải nhất) sang trái.
  2. Nhân đôi giá trị của các chữ số ở vị trí chẵn (tính từ phải sang trái, bỏ qua chữ số kiểm tra).
  3. Nếu kết quả nhân đôi lớn hơn 9, cộng 2 chữ số lại (hoặc trừ đi 9).
  4. Tính tổng tất cả các chữ số sau khi biến đổi.
  5. Nếu tổng chia hết cho 10 (`sum % 10 === 0`) thì số thẻ **hợp lệ**. Ngược lại là **thẻ giả / nhập sai số**.

### B. Kiểm tra BIN (Bank Identification Number) & Nhận diện Brand
- **Visa:** Bắt đầu bằng chữ số `4` (độ dài 13 hoặc 16 số).
- **Mastercard:** Bắt đầu từ dải `51` đến `55`, hoặc `2221` đến `2720` (độ dài 16 số).
- **American Express (Amex):** Bắt đầu bằng `34` hoặc `37` (độ dài 15 số).
- **JCB:** Bắt đầu từ dải `3528` đến `3589` (độ dài 16 số).

### C. Kiểm tra Ngày hết hạn (Expiry Validation)
- Định dạng bắt buộc: `MM/YY`.
- Tháng `MM` phải nằm trong dải `01` - `12`.
- Năm `YY` và tháng không được nằm trong quá khứ so với thời điểm hiện tại.

### D. Kiểm tra CVV/CVC
- 3 chữ số đối với Visa, Mastercard, JCB.
- 4 chữ số đối với American Express.

### E. Kiểm tra Tên chủ thẻ (Cardholder Name)
- Bắt buộc tối thiểu 2 từ, viết hoa không dấu, không chứa ký tự đặc biệt hay số.

---

## 3. Kiến trúc Backend & Database

### Model MongoDB (`server/src/models/PaymentMethod.js`)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['card'], default: 'card' },
  brand: { type: String, enum: ['Visa', 'Mastercard', 'Amex', 'JCB', 'Unknown'], required: true },
  last4: { type: String, required: true }, // Chỉ lưu 4 số cuối
  cardHolderName: { type: String, required: true },
  exp: { type: String, required: true }, // Định dạng MM/YY
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

### Các Endpoint API (`server/src/routes/payments.js`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/payments/methods` | User | Lấy danh sách thẻ đã lưu của người dùng (ưu tiên thẻ mặc định lên đầu) |
| `POST` | `/api/payments/methods` | User | Kiểm tra hợp lệ (Luhn, BIN, Exp, CVV) và lưu thẻ an toàn |
| `DELETE` | `/api/payments/methods/:id` | User | Xóa phương thức thanh toán. Nếu là thẻ mặc định, tự động đôn thẻ kế tiếp lên làm mặc định |
| `PATCH` | `/api/payments/methods/:id/default` | User | Đặt thẻ chỉ định làm phương thức thanh toán mặc định |

---

## 4. Giao diện Người dùng (Frontend Implementation)

### Màn hình `PaymentsScreen.tsx`
Gồm 2 Tab riêng biệt:
1. **Tab "Invoices & Receipts":** Kết nối 100% với danh sách đơn đặt phòng thực tế (`bookings`) trong hệ thống để xem chi tiết hóa đơn (mã phòng, số đêm, chi tiết giá tiền, thuế phí, ngày thanh toán).
2. **Tab "Payment Methods":**
   - Hiển thị danh sách thẻ thật từ MongoDB Atlas.
   - Huy hiệu nhận diện nhãn hiệu thẻ (Visa, Mastercard, JCB...).
   - Huy hiệu thẻ mặc định (`Default`).
   - Thao tác: "Set Default" và "Delete" có xác nhận an toàn.
   - **Modal thêm thẻ chuyên nghiệp:**
     - Tự động format số thẻ theo khối: `XXXX XXXX XXXX XXXX`.
     - Nhận diện thương hiệu thẻ thời gian thực khi người dùng gõ.
     - Tự động thêm dấu gạch chéo `/` cho hạn thẻ `MM/YY`.
     - Mã hóa mật khẩu cho trường CVV.
     - Hỗ trợ nút **"Quick Test Card"** (Visa `4242...`, Mastercard `5555...`) cho mục đích kiểm thử demo.

---

## 5. Dữ liệu Thẻ Thử nghiệm (Test Cards)

Dành cho Tester và Nhà phát triển:
| Loại thẻ | Số thẻ mẫu | Hạn dùng | CVV | Tên chủ thẻ |
| :--- | :---: | :---: | :---: | :--- |
| **Visa** | `4242 4242 4242 4242` | `12/28` | `123` | `NGUYEN VAN A` |
| **Mastercard** | `5555 5555 5555 4444` | `08/29` | `888` | `TRAN VAN B` |
| **JCB** | `3528 0000 0000 0000` | `10/27` | `321` | `LE THI C` |

> *Ghi chú:* Nhập các số thẻ ngẫu nhiên không thỏa mãn thuật toán Luhn sẽ bị hệ thống chặn ngay lập tức kèm thông báo lỗi chi tiết.

---

## 6. Nhật ký Phiên bản (Version Logs)

### 🚀 Phiên bản 1 (Ver1) - Khởi tạo & Tuân thủ Bảo mật
- **Ngày hoàn thành:** 04/11/2026.
- **Nội dung:**
  1. Xây dựng module kiểm tra thẻ `cardValidator.js` với thuật toán Luhn, nhận diện BIN và kiểm tra tính hợp lệ của hạn thẻ, CVV, tên chủ thẻ.
  2. Tạo Model MongoDB `PaymentMethod.js` theo chuẩn lưu trữ an toàn PCI-DSS.
  3. Cung cấp bộ API RESTful `/api/payments/methods` (GET, POST, DELETE, PATCH).
  4. Xây dựng `paymentService.ts` kết nối trực tiếp với backend server `:4000`.
  5. Thiết kế lại Tab "Payment Methods" trên `PaymentsScreen.tsx` với Modal nhập thẻ, nhận diện thương hiệu thời gian thực và quản lý thẻ mặc định.
- **Kiểm thử:** Đã kiểm thử với thẻ Visa test, thẻ sai checksum (báo lỗi chính xác), xóa thẻ và chuyển đổi thẻ mặc định mượt mà.

### 🔄 Phiên bản 2 (Ver2) - Kế hoạch Mở rộng Tiếp theo
- Tích hợp liên kết với Payment Gateway thực tế (Stripe Elements / VNPay SDK / Momo API).
- Tự động chọn thẻ mặc định khi người dùng chuyển sang bước thanh toán đặt phòng (`BookingCheckout`).
- Hỗ trợ lưu trữ ví điện tử (Apple Pay / Google Pay token).
