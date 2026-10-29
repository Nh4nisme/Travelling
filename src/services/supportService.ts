import { api } from './api';
import { tokenStorage } from './tokenStorage';

export type ReportCategoryId = 'booking' | 'payment' | 'listing' | 'account' | 'app' | 'other';

export type ReportPayload = {
  category: ReportCategoryId;
  description: string;
  /** Mã đặt phòng liên quan (nếu có). Email người gửi do server lấy từ tài khoản đăng nhập. */
  bookingRef?: string;
};

export type ReportReceipt = {
  /** Mã tham chiếu để người dùng nhắc lại khi liên hệ hỗ trợ. */
  reference: string;
  submittedAt: string;
};

export const supportService = {
  /** Gửi báo cáo sự cố -> lưu vào MongoDB (collection supportreports). Cần đăng nhập. */
  submitReport: async (payload: ReportPayload): Promise<ReportReceipt> => {
    const token = await tokenStorage.get();
    if (!token) throw new Error('Please sign in to report a problem.');
    return api<ReportReceipt>('/support/reports', { method: 'POST', body: payload, token });
  },
};
