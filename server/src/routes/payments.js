const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const PaymentMethod = require('../models/PaymentMethod');
const {
  validateLuhn,
  detectBrand,
  validateExpiry,
  validateCvv,
  validateHolderName,
} = require('../utils/cardValidator');

// 1. GET /api/payments/methods - Lấy danh sách thẻ đã lưu của người dùng
router.get('/methods', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const methods = await PaymentMethod.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    const formatted = methods.map((m) => ({
      id: m._id.toString(),
      type: m.type,
      brand: m.brand,
      last4: m.last4,
      cardHolderName: m.cardHolderName,
      exp: m.exp,
      isDefault: m.isDefault,
      createdAt: m.createdAt,
    }));

    res.json({ methods: formatted });
  } catch (error) {
    console.error('Lỗi lấy payment methods:', error.message);
    res.status(500).json({ message: 'Không thể tải danh sách phương thức thanh toán' });
  }
});

// 2. POST /api/payments/methods - Thêm thẻ thanh toán mới (Verify bằng Luhn Algorithm)
router.post('/methods', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardNumber, cardHolderName, exp, cvv, isDefault } = req.body || {};

    // 1. Kiểm tra trường rỗng
    if (!cardNumber || !cardHolderName || !exp || !cvv) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin thẻ' });
    }

    // 2. Kiểm tra tên chủ thẻ
    const trimmedName = String(cardHolderName).trim().toUpperCase();
    if (!validateHolderName(trimmedName)) {
      return res.status(400).json({
        message: 'Tên chủ thẻ phải viết bằng chữ in hoa không dấu (ví dụ: NGUYEN VAN A) và gồm ít nhất 2 từ',
      });
    }

    // 3. Nhận diện thương hiệu thẻ qua số đầu
    const cleanNumber = String(cardNumber).replace(/\D/g, '');
    const brand = detectBrand(cleanNumber);
    if (brand === 'Unknown') {
      return res.status(400).json({
        message: 'Thẻ không thuộc tổ chức hỗ trợ (chỉ chấp nhận Visa, Mastercard, JCB, Amex)',
      });
    }

    // 4. Xác thực số thẻ bằng thuật toán Luhn Checksum
    if (!validateLuhn(cleanNumber)) {
      return res.status(400).json({
        message: 'Số thẻ không hợp lệ theo chuẩn ngân hàng (Luhn Checksum failed). Vui lòng kiểm tra lại.',
      });
    }

    // 5. Kiểm tra hạn sử dụng (MM/YY)
    const trimmedExp = String(exp).trim();
    if (!validateExpiry(trimmedExp)) {
      return res.status(400).json({
        message: 'Hạn sử dụng không hợp lệ hoặc thẻ đã hết hạn (định dạng: MM/YY)',
      });
    }

    // 6. Kiểm tra mã bảo mật CVV/CVC
    const trimmedCvv = String(cvv).trim();
    if (!validateCvv(trimmedCvv, brand)) {
      return res.status(400).json({
        message: `Mã CVV/CVC không hợp lệ (${brand === 'Amex' ? 4 : 3} chữ số)`,
      });
    }

    // 7. Lấy 4 số cuối để mask bảo mật theo chuẩn PCI-DSS
    const last4 = cleanNumber.slice(-4);

    // 8. Kiểm tra xem user đã thêm thẻ này chưa
    const existing = await PaymentMethod.findOne({ userId, brand, last4, exp: trimmedExp });
    if (existing) {
      return res.status(409).json({ message: 'Thẻ này đã tồn tại trong danh sách của bạn' });
    }

    // 9. Xử lý đặt làm thẻ mặc định
    const currentCount = await PaymentMethod.countDocuments({ userId });
    const shouldBeDefault = Boolean(isDefault) || currentCount === 0;

    if (shouldBeDefault) {
      await PaymentMethod.updateMany({ userId }, { $set: { isDefault: false } });
    }

    // 10. Lưu thẻ vào MongoDB Atlas (Tuyệt đối không lưu full số thẻ và CVV)
    const newCard = await PaymentMethod.create({
      userId,
      type: 'card',
      brand,
      last4,
      cardHolderName: trimmedName,
      exp: trimmedExp,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      method: {
        id: newCard._id.toString(),
        type: newCard.type,
        brand: newCard.brand,
        last4: newCard.last4,
        cardHolderName: newCard.cardHolderName,
        exp: newCard.exp,
        isDefault: newCard.isDefault,
        createdAt: newCard.createdAt,
      },
      message: 'Thêm thẻ thanh toán thành công!',
    });
  } catch (error) {
    console.error('Lỗi thêm payment method:', error.message);
    res.status(500).json({ message: 'Không thể thêm thẻ thanh toán' });
  }
});

// 3. DELETE /api/payments/methods/:id - Xóa thẻ thanh toán
router.delete('/methods/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cardId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'ID thẻ không hợp lệ' });
    }

    const card = await PaymentMethod.findOne({ _id: cardId, userId });
    if (!card) {
      return res.status(404).json({ message: 'Thẻ không tồn tại hoặc đã bị xóa' });
    }

    const wasDefault = card.isDefault;
    await PaymentMethod.deleteOne({ _id: cardId });

    // Nếu vừa xóa thẻ mặc định, tự động chuyển thẻ còn lại mới nhất làm mặc định
    if (wasDefault) {
      const remaining = await PaymentMethod.findOne({ userId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.json({ ok: true, message: 'Đã xóa thẻ thanh toán thành công' });
  } catch (error) {
    console.error('Lỗi xóa payment method:', error.message);
    res.status(500).json({ message: 'Không thể xóa thẻ thanh toán' });
  }
});

// 4. PATCH /api/payments/methods/:id/default - Đặt thẻ làm mặc định
router.patch('/methods/:id/default', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cardId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'ID thẻ không hợp lệ' });
    }

    const card = await PaymentMethod.findOne({ _id: cardId, userId });
    if (!card) {
      return res.status(404).json({ message: 'Thẻ không tồn tại' });
    }

    await PaymentMethod.updateMany({ userId }, { $set: { isDefault: false } });
    card.isDefault = true;
    await card.save();

    res.json({ ok: true, message: 'Đã đặt làm thẻ mặc định', method: card });
  } catch (error) {
    console.error('Lỗi cập nhật default method:', error.message);
    res.status(500).json({ message: 'Không thể cập nhật thẻ mặc định' });
  }
});

module.exports = router;
