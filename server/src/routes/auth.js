const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sign = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Vui lòng nhập đủ họ tên, email và mật khẩu' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Email không hợp lệ' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'Email này đã được đăng ký' });

    const user = await User.create({ name, email, password, phone });
    res.status(201).json({ token: sign(user), user: user.toPublic() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
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

module.exports = router;
