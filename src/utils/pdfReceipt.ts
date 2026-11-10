import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Booking } from '@/store/types';
import { fmtISO, fmtDateTime } from '@/utils/date';
import { money } from '@/utils/pricing';

export function formatFilenameDateTime(dateStr?: string | Date | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}h${minutes}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '_');
}

export function buildReceiptHtml(b: Booking, isVietnamese = false, customerName?: string): string {
  const isPaidFull = b.payment.method === 'full';
  const methodText = isPaidFull
    ? (isVietnamese ? 'Thanh toán toàn bộ' : 'Pay in full')
    : (isVietnamese ? 'Đặt cọc 50%' : '50% Deposit');

  const statusText = b.status === 'confirmed'
    ? (isVietnamese ? 'ĐÃ XÁC NHẬN' : 'CONFIRMED')
    : (isVietnamese ? 'CHỜ XÁC NHẬN' : 'PENDING');

  // Tên mặc định file PDF: ngày giờ đặt + người đặt
  const timePart = formatFilenameDateTime(b.createdAt);
  const namePart = sanitizeFilename(customerName || 'Guest');
  const defaultPdfName = `${timePart}_${namePart}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${defaultPdfName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1F2937;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 28px;
      font-weight: 800;
      color: #0A7F8F;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      background: #DDF6E6;
      color: #166534;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 16px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .row.bold {
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 30px;
    }
    th {
      background: #F3F4F6;
      text-align: left;
      padding: 12px;
      font-size: 13px;
      font-weight: 700;
      color: #4B5563;
      border-bottom: 2px solid #E5E7EB;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #E5E7EB;
      font-size: 14px;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      width: 320px;
      margin-left: auto;
      margin-bottom: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    .total-row.highlight {
      font-size: 18px;
      font-weight: 800;
      color: #0A7F8F;
      border-top: 2px solid #E5E7EB;
      padding-top: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      font-size: 12px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 20px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Travelling</div>
      <div style="font-size: 14px; color: #6B7280; margin-top: 4px;">
        ${isVietnamese ? 'Biên lai đặt phòng chính thức' : 'Official Booking Receipt'}
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${statusText}</span>
      <div style="font-size: 13px; color: #6B7280; margin-top: 8px;">
        Ref: <strong>${b.ref}</strong>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">${isVietnamese ? 'Thông tin chỗ ở' : 'Property Details'}</div>
      <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px;">
        ${b.listing.title}
      </div>
      <div style="font-size: 14px; color: #4B5563;">
        ${b.listing.city}, ${b.listing.country}
      </div>
      <div class="row" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E5E7EB;">
        <span>${isVietnamese ? 'Người đặt:' : 'Booked by:'}</span>
        <strong>${customerName || (isVietnamese ? 'Khách hàng' : 'Guest')}</strong>
      </div>
    </div>

    <div class="card">
      <div class="card-title">${isVietnamese ? 'Thời gian lưu trú' : 'Stay Schedule'}</div>
      <div class="row">
        <span>${isVietnamese ? 'Nhận phòng:' : 'Check-in:'}</span>
        <strong>${fmtISO(b.checkIn)} (${b.listing.checkInTime})</strong>
      </div>
      <div class="row">
        <span>${isVietnamese ? 'Trả phòng:' : 'Check-out:'}</span>
        <strong>${fmtISO(b.checkOut)} (${b.listing.checkOutTime})</strong>
      </div>
      <div class="row">
        <span>${isVietnamese ? 'Số lượng khách:' : 'Guests:'}</span>
        <strong>${b.guests} ${isVietnamese ? 'khách' : 'guest(s)'} (${b.nights} ${isVietnamese ? 'đêm' : 'night(s)'})</strong>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isVietnamese ? 'Mô tả dịch vụ' : 'Description'}</th>
        <th class="text-right">${isVietnamese ? 'Đơn giá' : 'Rate'}</th>
        <th class="text-right">${isVietnamese ? 'Số lượng' : 'Qty'}</th>
        <th class="text-right">${isVietnamese ? 'Thành tiền' : 'Amount'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${isVietnamese ? 'Tiền phòng' : 'Room accommodation'}</td>
        <td class="text-right">${money(b.price.nightly)}</td>
        <td class="text-right">${b.nights} ${isVietnamese ? 'đêm' : 'night(s)'}</td>
        <td class="text-right">${money(b.price.subtotal)}</td>
      </tr>
      ${b.price.fees.map((f) => `
      <tr>
        <td>${f.label}</td>
        <td class="text-right">${money(f.amount)}</td>
        <td class="text-right">1</td>
        <td class="text-right">${money(f.amount)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span>${isVietnamese ? 'Tổng chi phí:' : 'Total amount:'}</span>
      <strong>${money(b.price.total)}</strong>
    </div>
    <div class="total-row">
      <span>${isVietnamese ? 'Hình thức thanh toán:' : 'Payment method:'}</span>
      <span>${methodText}</span>
    </div>
    <div class="total-row highlight">
      <span>${isVietnamese ? 'Đã thanh toán:' : 'Amount paid:'}</span>
      <span>${money(b.payment.amountPaid)}</span>
    </div>
    ${b.payment.balanceDue > 0 ? `
    <div class="total-row" style="color: #D97706; font-weight: 700;">
      <span>${isVietnamese ? 'Còn lại khi nhận phòng:' : 'Due at check-in:'}</span>
      <span>${money(b.payment.balanceDue)}</span>
    </div>
    ` : ''}
    <div class="total-row" style="font-size: 13px; color: #6B7280; margin-top: 8px;">
      <span>${isVietnamese ? 'Thời gian giao dịch:' : 'Transaction date:'}</span>
      <span>${fmtDateTime(b.createdAt)}</span>
    </div>
  </div>

  <div class="footer">
    <p>${isVietnamese ? 'Cảm ơn bạn đã lựa chọn Travelling! Chúc bạn có một hành trình an toàn và trọn vẹn.' : 'Thank you for booking with Travelling! Wishing you a safe and memorable journey.'}</p>
    <p>Travelling App • https://travelling.app</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Xuất / Tải biên lai PDF đúng thông tin giao dịch (TC13)
 * - Sử dụng Print.printAsync: Mở trình xem trước và Lưu PDF của hệ điều hành
 *   (Trên Android & iOS: Tự động kích hoạt màn hình Print Spooler với tùy chọn "Save as PDF" / Lưu dưới dạng PDF)
 *   (Trên Web: Kích hoạt hộp thoại In / Lưu PDF của trình duyệt)
 * - Đảm bảo không bị lỗi quyền truy cập file "Not allowed to read file under given URL" trên Android.
 */
export async function downloadReceiptPdf(
  b: Booking,
  isVietnamese = false,
  customerName?: string
): Promise<void> {
  const html = buildReceiptHtml(b, isVietnamese, customerName);

  try {
    await Print.printAsync({ html });
  } catch (err: any) {
    // Fallback: nếu printAsync gặp sự cố trên thiết bị đặc thù, thử qua file sharing
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: isVietnamese ? 'Lưu biên lai PDF' : 'Save PDF Receipt',
        });
        return;
      }
    } catch {
      // bỏ qua lỗi fallback để ném lỗi gốc
    }
    throw err;
  }
}
