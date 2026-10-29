const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

function formatTime(date) {
  if (!date) return 'Just now';
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

// 1. Lấy danh sách hội thoại của người dùng hiện tại (Database MongoDB)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      $or: [{ host: userId }, { renter: userId }],
    })
      .populate('host', 'name email phone')
      .populate('renter', 'name email phone')
      .sort({ lastMessageTime: -1 });

    const formatted = conversations.map((c) => {
      const isHost = c.host && c.host._id.equals(userId);
      const partner = isHost ? c.renter : c.host;
      const isUnread = Array.isArray(c.unreadBy) && c.unreadBy.some((uid) => uid.equals(userId));

      return {
        id: c._id.toString(),
        hostName: partner ? partner.name : 'User',
        partnerEmail: partner ? partner.email : '',
        partnerPhone: partner ? partner.phone : '',
        hostAvatar: 12,
        role: isHost ? 'Verified Guest' : 'Superhost',
        isHostView: isHost,
        status: c.status,
        statusLabel: c.statusLabel,
        listingId: c.listingId,
        listingTitle: c.listingTitle,
        listingImage: c.listingImage,
        listingPrice: c.listingPrice,
        dates: c.dates,
        lastMessage: c.lastMessage,
        lastMessageTime: formatTime(c.lastMessageTime),
        unread: isUnread,
      };
    });

    res.json({ conversations: formatted });
  } catch (error) {
    console.error('Lỗi lấy conversations:', error.message);
    res.status(500).json({ message: 'Không thể tải danh sách tin nhắn' });
  }
});

// 2. Lấy danh sách tin nhắn của 1 hội thoại
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id)
      .populate('host', 'name')
      .populate('renter', 'name');

    if (!conversation) {
      return res.status(404).json({ message: 'Hội thoại không tồn tại' });
    }

    const isMember =
      conversation.host._id.equals(userId) || conversation.renter._id.equals(userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền xem hội thoại này' });
    }

    // Đánh dấu đã đọc cho user hiện tại
    if (conversation.unreadBy && conversation.unreadBy.some((uid) => uid.equals(userId))) {
      conversation.unreadBy = conversation.unreadBy.filter((uid) => !uid.equals(userId));
      await conversation.save();
    }

    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name');

    const isHost = conversation.host._id.equals(userId);

    const formattedMessages = messages.map((m) => {
      const isSelf = m.sender._id.equals(userId);
      return {
        id: m._id.toString(),
        sender: isSelf ? (isHost ? 'host' : 'renter') : isHost ? 'renter' : 'host',
        senderName: m.sender ? m.sender.name : 'Unknown',
        text: m.text,
        image: m.image,
        time: formatTime(m.createdAt),
        timestamp: m.createdAt.getTime(),
      };
    });

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Lỗi lấy messages:', error.message);
    res.status(500).json({ message: 'Không thể tải tin nhắn' });
  }
});

// 3. Gửi tin nhắn mới vào hội thoại
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được rỗng' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Hội thoại không tồn tại' });
    }

    const isMember =
      conversation.host.equals(userId) || conversation.renter.equals(userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền nhắn tin trong hội thoại này' });
    }

    // Tạo message mới
    const message = await Message.create({
      conversation: id,
      sender: userId,
      text: (text || '').trim(),
      image: image || '',
    });

    // Cập nhật conversation
    const otherUserId = conversation.host.equals(userId)
      ? conversation.renter
      : conversation.host;

    conversation.lastMessage = (text || 'Photo attachment').trim();
    conversation.lastMessageTime = new Date();
    if (!conversation.unreadBy.some((uid) => uid.equals(otherUserId))) {
      conversation.unreadBy.push(otherUserId);
    }
    await conversation.save();

    const isHost = conversation.host.equals(userId);

    res.status(201).json({
      message: {
        id: message._id.toString(),
        sender: isHost ? 'host' : 'renter',
        senderName: req.user.name,
        text: message.text,
        image: message.image,
        time: formatTime(message.createdAt),
        timestamp: message.createdAt.getTime(),
      },
    });
  } catch (error) {
    console.error('Lỗi gửi message:', error.message);
    res.status(500).json({ message: 'Không thể gửi tin nhắn' });
  }
});

// 4. Tạo hoặc mở hội thoại tư vấn (Inquiry)
router.post('/inquire', auth, async (req, res) => {
  try {
    const renterId = req.user._id;
    const { hostId, listingId, listingTitle, listingImage, listingPrice } = req.body;

    if (!hostId) {
      return res.status(400).json({ message: 'Thiếu hostId' });
    }

    let conversation = await Conversation.findOne({
      host: hostId,
      renter: renterId,
      listingId: listingId || '',
    });

    if (!conversation) {
      conversation = await Conversation.create({
        host: hostId,
        renter: renterId,
        listingId: listingId || '',
        listingTitle: listingTitle || 'Listing',
        listingImage: listingImage || '',
        listingPrice: listingPrice || 0,
        status: 'inquiry',
        statusLabel: `Inquiry · ${listingTitle || 'Stay'}`,
        lastMessage: 'Started conversation with host.',
        lastMessageTime: new Date(),
        unreadBy: [hostId],
      });

      // Tạo tin nhắn chào mở đầu
      await Message.create({
        conversation: conversation._id,
        sender: hostId,
        text: `Hi ${req.user.name}! Thank you for your interest in ${listingTitle || 'our home'}. How can I assist you?`,
      });
    }

    res.json({ conversationId: conversation._id.toString() });
  } catch (error) {
    console.error('Lỗi tạo inquiry:', error.message);
    res.status(500).json({ message: 'Không thể tạo cuộc hội thoại' });
  }
});

module.exports = router;
