const mongoose = require('mongoose');

/**
 * Mỗi đêm đã có người đặt = 1 document. Index UNIQUE (listingId, night) là hàng rào chống đặt trùng:
 * hai người cùng đặt một đêm cùng lúc thì chỉ một người insert thành công, người còn lại nhận lỗi trùng khoá.
 * (Chỉ kiểm tra "có trùng không" rồi mới lưu thì vẫn bị race condition.)
 */
const bookedNightSchema = new mongoose.Schema(
  {
    listingId: { type: String, required: true },
    night: { type: Date, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  },
  { versionKey: false },
);

bookedNightSchema.index({ listingId: 1, night: 1 }, { unique: true });

module.exports = mongoose.model('BookedNight', bookedNightSchema);
