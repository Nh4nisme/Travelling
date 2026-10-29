const mongoose = require('mongoose');

const REPORT_CATEGORIES = ['booking', 'payment', 'listing', 'account', 'app', 'other'];
const REPORT_STATUSES = ['open', 'in_progress', 'resolved'];

const supportReportSchema = new mongoose.Schema(
  {
    // Mã tham chiếu hiển thị cho người dùng, vd. TR-K7M2QX
    reference: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Lưu bản sao email tại thời điểm gửi để đội hỗ trợ phản hồi, kể cả khi user đổi email sau này.
    email: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, required: true, enum: REPORT_CATEGORIES },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
    bookingRef: { type: String, trim: true, maxlength: 40, default: '' },
    status: { type: String, enum: REPORT_STATUSES, default: 'open' },
  },
  { timestamps: true, versionKey: false },
);

supportReportSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    reference: this.reference,
    category: this.category,
    description: this.description,
    bookingRef: this.bookingRef || undefined,
    status: this.status,
    submittedAt: this.createdAt.toISOString(),
  };
};

module.exports = mongoose.model('SupportReport', supportReportSchema);
module.exports.REPORT_CATEGORIES = REPORT_CATEGORIES;
