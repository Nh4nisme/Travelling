const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listingId: { type: String, trim: true },
    listingTitle: { type: String, trim: true },
    listingImage: { type: String, trim: true },
    listingPrice: { type: Number, default: 0 },
    dates: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['inquiry', 'confirmed', 'past', 'support'],
      default: 'inquiry',
      index: true,
    },
    statusLabel: { type: String, trim: true, default: 'Inquiry' },
    lastMessage: { type: String, trim: true, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    unreadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
