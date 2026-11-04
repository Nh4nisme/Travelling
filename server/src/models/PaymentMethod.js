const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['card'], default: 'card' },
    brand: { type: String, required: true }, // 'Visa', 'Mastercard', 'JCB', 'Amex'
    last4: { type: String, required: true, maxlength: 4 },
    cardHolderName: { type: String, required: true, trim: true },
    exp: { type: String, required: true }, // 'MM/YY'
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
