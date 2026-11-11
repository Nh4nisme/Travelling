const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');
const { sendOtpEmail } = require('../services/emailService');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sign = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

// POST /api/auth/check-email - Kiểm tra định dạng và trạng thái tồn tại của Email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ message: 'Email không đúng định dạng', code: 'INVALID_EMAIL' });
    }

    const normalized = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalized });

    if (exists) {
      return res.status(200).json({
        exists: true,
        message: 'Email này đã được đăng ký. Bạn có muốn chuyển sang Đăng nhập?',
      });
    }

    return res.status(200).json({ exists: false, message: 'Email hợp lệ' });
  } catch (e) {
    console.error('Lỗi check-email:', e);
    res.status(500).json({ message: 'Lỗi kiểm tra email' });
  }
});

// POST /api/auth/send-otp - Gửi mã OTP xác thực email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ message: 'Email không đúng định dạng', code: 'INVALID_EMAIL' });
    }

    const normalized = String(email).toLowerCase().trim();

    // Luồng ngoại lệ 3a: Kiểm tra email đã đăng ký chưa
    const exists = await User.findOne({ email: normalized });
    if (exists) {
      return res.status(409).json({
        message: 'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.',
        code: 'EMAIL_EXISTS',
      });
    }

    // Luồng ngoại lệ 5c: Kiểm tra trạng thái tạm khóa khi nhập sai quá nhiều lần
    const existingOtp = await Otp.findOne({ email: normalized });
    if (existingOtp && existingOtp.blockedUntil && existingOtp.blockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((existingOtp.blockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        message: `Yêu cầu xác thực tạm thời bị khóa do nhập sai OTP quá số lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        code: 'OTP_BLOCKED',
        blockedUntil: existingOtp.blockedUntil,
      });
    }

    // Luồng 5: Sinh mã OTP 6 số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // Hết hạn sau 3 phút

    await Otp.findOneAndUpdate(
      { email: normalized },
      {
        otp: otpCode,
        attempts: 0,
        blockedUntil: null,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // Gửi email OTP thực sự
    try {
      await sendOtpEmail(normalized, otpCode);
      console.log(`✅ [OTP] Đã gửi mã OTP đến ${normalized}`);
    } catch (emailError) {
      console.error('❌ [EMAIL SERVICE] Lỗi gửi email:', emailError.message);
      // Nếu không gửi được email, trả lỗi cho client
      return res.status(500).json({ 
        message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.', 
        code: 'EMAIL_SEND_FAILED' 
      });
    }

    return res.json({
      message: 'Mã xác thực OTP đã được gửi đến email của bạn',
      expiresInSeconds: 180,
    });
  } catch (e) {
    console.error('Lỗi send-otp:', e);
    // Luồng ngoại lệ 4a: Không thể gửi OTP
    res.status(500).json({ message: 'Không thể gửi mã OTP. Vui lòng thử lại sau ít phút.', code: 'SEND_FAILED' });
  }
});

// POST /api/auth/verify-otp - Xác thực mã OTP nhận được
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP' });
    }

    const normalized = String(email).toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalized });

    // Luồng ngoại lệ 5b: OTP hết hạn hoặc không tồn tại
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi mã mới.',
        code: 'OTP_EXPIRED',
      });
    }

    // Luồng ngoại lệ 5c: Kiểm tra trạng thái tạm khóa
    if (otpRecord.blockedUntil && otpRecord.blockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((otpRecord.blockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        message: `Yêu cầu xác thực tạm thời bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        code: 'OTP_BLOCKED',
      });
    }

    // Luồng ngoại lệ 5a: OTP không chính xác
    if (otpRecord.otp !== String(otp).trim()) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;

      // Luồng 5c: Sai quá 5 lần -> Tạm khóa 10 phút
      if (otpRecord.attempts >= 5) {
        otpRecord.blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await otpRecord.save();
        return res.status(429).json({
          message: 'Bạn đã nhập sai mã OTP quá 5 lần. Yêu cầu xác thực tạm thời bị khóa 10 phút.',
          code: 'OTP_MAX_ATTEMPTS',
        });
      }

      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`,
        remainingAttempts: remaining,
        code: 'OTP_INVALID',
      });
    }

    // Luồng 7 & 8: OTP chính xác ➔ Xóa OTP và sinh verification token bảo mật (có hạn 15 phút)
    await Otp.deleteOne({ _id: otpRecord._id });

    const verificationToken = jwt.sign(
      { email: normalized, purpose: 'email-verification' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      verified: true,
      verificationToken,
      message: 'Xác thực mã OTP thành công',
    });
  } catch (e) {
    console.error('Lỗi verify-otp:', e);
    res.status(500).json({ message: 'Lỗi xác thực mã OTP' });
  }
});

// POST /api/auth/register - Hoàn tất tạo tài khoản
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, verificationToken } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ họ tên, email và mật khẩu' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Email không hợp lệ' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });

    const normalized = String(email).toLowerCase().trim();

    // Kiểm tra token xác thực OTP nếu có gửi lên
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        if (decoded.email !== normalized || decoded.purpose !== 'email-verification') {
          return res.status(401).json({ message: 'Mã xác thực email không hợp lệ.' });
        }
      } catch {
        return res.status(401).json({ message: 'Phiên xác thực email đã hết hạn. Vui lòng xác thực lại OTP.' });
      }
    }

    const exists = await User.findOne({ email: normalized });
    if (exists) return res.status(409).json({ message: 'Email này đã được đăng ký' });

    const user = await User.create({ name: String(name).trim(), email: normalized, password, phone });
    res.status(201).json({ token: sign(user), user: user.toPublic() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    res.json({ token: sign(user), user: user.toPublic() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// GET /api/auth/me  (cần header Authorization: Bearer <token>)
router.get('/me', auth, (req, res) => res.json({ user: req.user.toPublic() }));

// PATCH /api/auth/me - Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    const { name, phone } = req.body || {};

    // Validate name - required and not empty
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Tên không được để trống' });
      }
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = typeof phone === 'string' ? phone.trim() : '';

    // Only proceed if there are updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu cập nhật' });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ user: user.toPublic() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// POST /api/auth/favorites/:id - Toggle favorite listing id
router.post('/favorites/:id', auth, async (req, res) => {
  try {
    const listingId = String(req.params.id);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    const index = user.favorites.indexOf(listingId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(listingId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// Set/Update Payment PIN
router.post('/payment-pin', auth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    
    // Validate new PIN (6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ 
        message: 'Payment PIN must be exactly 6 digits' 
      });
    }
    
    const user = await User.findById(req.user._id).select('+paymentPin');
    
    // Nếu đã có PIN, phải verify current PIN trước
    if (user.paymentPinSet) {
      if (!currentPin) {
        return res.status(400).json({ 
          message: 'Current PIN is required' 
        });
      }
      
      const isValid = await user.comparePaymentPin(currentPin);
      if (!isValid) {
        return res.status(401).json({ 
          message: 'Current PIN is incorrect' 
        });
      }
    }
    
    // Set new PIN
    user.paymentPin = newPin;
    await user.save();
    
    res.json({ 
      message: 'Payment PIN updated successfully',
      user: user.toPublic()
    });
  } catch (error) {
    console.error('Lỗi cập nhật Payment PIN:', error.message);
    res.status(500).json({ message: 'Failed to update Payment PIN' });
  }
});

// Verify Payment PIN
router.post('/verify-payment-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ 
        message: 'Invalid PIN format' 
      });
    }
    
    const user = await User.findById(req.user._id).select('+paymentPin +paymentPinSet');
    
    if (!user.paymentPinSet) {
      return res.status(400).json({ 
        message: 'Payment PIN not set. Please set up your PIN first.' 
      });
    }
    
    const isValid = await user.comparePaymentPin(pin);
    
    if (!isValid) {
      return res.status(401).json({ 
        message: 'Incorrect Payment PIN' 
      });
    }
    
    res.json({ 
      valid: true,
      message: 'Payment PIN verified successfully' 
    });
  } catch (error) {
    console.error('Lỗi verify Payment PIN:', error.message);
    res.status(500).json({ message: 'Failed to verify Payment PIN' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (e) {
    console.error('Lỗi đổi mật khẩu:', e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
