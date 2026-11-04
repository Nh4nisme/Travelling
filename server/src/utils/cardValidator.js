/**
 * cardValidator.js
 * Bộ công cụ kiểm tra tính hợp lệ của thẻ ngân hàng theo chuẩn quốc tế:
 * 1. Thuật toán Luhn (Luhn Checksum / Mod 10)
 * 2. BIN Check (Nhận diện thương hiệu thẻ: Visa, Mastercard, JCB, Amex)
 * 3. Kiểm tra Ngày hết hạn (MM/YY, tương lai)
 * 4. Kiểm tra mã bảo mật CVV/CVC
 * 5. Kiểm tra Tên chủ thẻ (chữ cái không dấu, in hoa)
 */

// 1. Thuật toán Luhn Checksum
function validateLuhn(numberStr) {
  if (typeof numberStr !== 'string') return false;
  const digits = numberStr.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// 2. Nhận diện thương hiệu thẻ qua số đầu (BIN Check)
function detectBrand(numberStr) {
  if (typeof numberStr !== 'string') return 'Unknown';
  const clean = numberStr.replace(/\D/g, '');

  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'Amex';
  if (/^(?:2131|1800|35\d{3})/.test(clean)) return 'JCB';

  return 'Unknown';
}

// 3. Kiểm tra hạn sử dụng thẻ (MM/YY)
function validateExpiry(expStr) {
  if (typeof expStr !== 'string') return false;
  const match = expStr.trim().match(/^(\d{1,2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt('20' + match[2], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Phải lớn hơn hoặc bằng tháng hiện tại của năm hiện tại
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 20) return false; // Thẻ không được quá 20 năm tới

  return true;
}

// 4. Kiểm tra mã bảo mật CVV/CVC
function validateCvv(cvv, brand) {
  if (typeof cvv !== 'string') return false;
  const clean = cvv.trim();
  const requiredLen = brand === 'Amex' ? 4 : 3;
  return new RegExp(`^\\d{${requiredLen}}$`).test(clean);
}

// 5. Kiểm tra Tên chủ thẻ (chữ cái không dấu, 2 từ trở lên)
function validateHolderName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;
  // Cho phép chữ cái tiếng Anh và khoảng trắng
  return /^[a-zA-Z\s]+$/.test(trimmed) && trimmed.includes(' ');
}

module.exports = {
  validateLuhn,
  detectBrand,
  validateExpiry,
  validateCvv,
  validateHolderName,
};
