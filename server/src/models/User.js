const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    favorites: [{ type: String }],
    password: { type: String, required: true, minlength: 6, select: false },
    // Payment PIN (6 digits, hashed in DB)
    paymentPin: { 
      type: String, 
      select: false,
      default: null 
    },
    paymentPinSet: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Hash Payment PIN trước khi lưu (nếu có thay đổi)
userSchema.pre('save', async function (next) {
  if (!this.isModified('paymentPin')) return next();
  if (this.paymentPin) {
    this.paymentPin = await bcrypt.hash(this.paymentPin, 10);
    this.paymentPinSet = true;
  }
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.comparePaymentPin = function (plainPin) {
  if (!this.paymentPin) return false;
  return bcrypt.compare(plainPin, this.paymentPin);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    favorites: this.favorites || [],
    paymentPinSet: this.paymentPinSet || false,
  };
};

module.exports = mongoose.model('User', userSchema);
