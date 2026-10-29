const mongoose = require('mongoose');
const rules = require('../services/bookingRules');

const feeSchema = new mongoose.Schema({ label: String, amount: Number }, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: String, required: true, index: true },
    // Ảnh chụp thông tin chỗ ở tại thời điểm đặt: sau này chủ nhà đổi giá/tên thì booking cũ không bị sai
    listing: {
      title: String, city: String, country: String, image: String,
      price: Number, checkInTime: String, checkOutTime: String,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    price: {
      nightly: Number, nights: Number, subtotal: Number,
      fees: [feeSchema], feesTotal: Number, total: Number,
    },
    payment: {
      method: { type: String, enum: rules.PAYMENT_METHODS, required: true },
      status: { type: String, enum: ['paid', 'partial', 'refunded', 'partially_refunded', 'no_refund'], required: true },
      amountPaid: { type: Number, default: 0 },
      balanceDue: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      provider: { type: String, default: 'simulated' },
      paidAt: Date,
      balancePaidAt: Date,
    },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: Date,
    idempotencyKey: String,
  },
  { timestamps: true, versionKey: false },
);

bookingSchema.index({ user: 1, createdAt: -1 });
// Cùng một người + cùng một khoá => chỉ tạo 1 booking (chống bấm đúp / gửi lại khi mạng chập chờn)
bookingSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

bookingSchema.methods.toPublic = function toPublic(today = rules.todayUTC()) {
  const cancellation = rules.cancellationInfo(
    { status: this.status, checkIn: this.checkIn, amountPaid: this.payment.amountPaid },
    today,
  );
  const p = this.price || {};
  return {
    id: this._id.toString(),
    ref: this.ref,
    status: this.status,
    stage: rules.stageOf(this.status, this.checkIn, this.checkOut, today),
    listing: {
      id: this.listingId,
      title: this.listing?.title, city: this.listing?.city, country: this.listing?.country, image: this.listing?.image,
      price: this.listing?.price, checkInTime: this.listing?.checkInTime, checkOutTime: this.listing?.checkOutTime,
    },
    checkIn: rules.toDateOnly(this.checkIn),
    checkOut: rules.toDateOnly(this.checkOut),
    nights: this.nights,
    adults: this.adults,
    children: this.children,
    guests: this.adults + this.children,
    price: {
      nightly: p.nightly, nights: p.nights, subtotal: p.subtotal,
      fees: (p.fees || []).map((f) => ({ label: f.label, amount: f.amount })),
      feesTotal: p.feesTotal, total: p.total,
    },
    payment: {
      method: this.payment.method,
      status: this.payment.status,
      amountPaid: this.payment.amountPaid,
      balanceDue: this.payment.balanceDue,
      refundAmount: this.payment.refundAmount,
      provider: this.payment.provider,
      paidAt: this.payment.paidAt ? this.payment.paidAt.toISOString() : null,
      balancePaidAt: this.payment.balancePaidAt ? this.payment.balancePaidAt.toISOString() : null,
    },
    cancellation,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
