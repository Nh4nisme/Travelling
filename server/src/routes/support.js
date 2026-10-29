const express = require('express');
const crypto = require('crypto');
const SupportReport = require('../models/SupportReport');
const { REPORT_CATEGORIES } = SupportReport;
const auth = require('../middleware/auth');

const router = express.Router();

const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 1000;
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ I, O, 0, 1 cho dễ đọc

const makeReference = () =>
  'TR-' + Array.from(crypto.randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');

// POST /api/support/reports - gửi báo cáo sự cố (cần đăng nhập)
router.post('/reports', auth, async (req, res) => {
  try {
    const { category, description, bookingRef } = req.body || {};

    if (!REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Vui lòng chọn loại sự cố hợp lệ' });
    }
    const text = typeof description === 'string' ? description.trim() : '';
    if (text.length < MIN_DESCRIPTION) {
      return res.status(400).json({ message: `Mô tả tối thiểu ${MIN_DESCRIPTION} ký tự` });
    }
    if (text.length > MAX_DESCRIPTION) {
      return res.status(400).json({ message: `Mô tả tối đa ${MAX_DESCRIPTION} ký tự` });
    }
    if (bookingRef !== undefined && bookingRef !== null && (typeof bookingRef !== 'string' || bookingRef.length > 40)) {
      return res.status(400).json({ message: 'Mã đặt phòng không hợp lệ' });
    }

    // Email lấy từ tài khoản đang đăng nhập (không tin dữ liệu client gửi lên).
    const base = {
      user: req.user._id,
      email: req.user.email,
      category,
      description: text,
      bookingRef: typeof bookingRef === 'string' ? bookingRef.trim() : '',
    };

    // Mã tham chiếu ngẫu nhiên có thể (rất hiếm) trùng -> thử lại vài lần khi vi phạm unique.
    let report;
    for (let attempt = 0; attempt < 5 && !report; attempt += 1) {
      try {
        report = await SupportReport.create({ ...base, reference: makeReference() });
      } catch (e) {
        if (!(e && e.code === 11000)) throw e;
      }
    }
    if (!report) return res.status(500).json({ message: 'Không tạo được mã tham chiếu, vui lòng thử lại' });

    res.status(201).json({ reference: report.reference, submittedAt: report.createdAt.toISOString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// GET /api/support/reports - danh sách báo cáo của chính người dùng (mới nhất trước)
router.get('/reports', auth, async (req, res) => {
  try {
    const reports = await SupportReport.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ reports: reports.map((r) => r.toPublic()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
