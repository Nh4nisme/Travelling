const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
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
    let conversations = await Conversation.find({
      $or: [{ host: userId }, { renter: userId }],
    })
      .populate('host', 'name email phone')
      .populate('renter', 'name email phone')
      .sort({ lastMessageTime: -1 });

    // NẾU NGƯỜI DÙNG LÀ RENTER MỚI VÀ CHƯA CÓ HỘI THOẠI NÀO TRÊN MONGODB:
    // Tự động khởi tạo ngay 1 cuộc hội thoại thật trên MongoDB với Host Jinny Oslin!
    if (conversations.length === 0 && req.user.email !== 'jinny@gmail.com') {
      const host = await User.findOne({ email: 'jinny@gmail.com' });
      if (host) {
        const newConv = await Conversation.create({
          host: host._id,
          renter: userId,
          listingId: '4',
          listingTitle: 'Balian treehouse',
          listingImage:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
          listingPrice: 20,
          dates: 'Inquiry',
          status: 'inquiry',
          statusLabel: 'Inquiry · Balian treehouse',
          lastMessage: `Hi ${req.user.name}! Welcome to Travelling. Let me know if you need any details about Balian treehouse!`,
          lastMessageTime: new Date(),
          unreadBy: [userId],
        });

        await Message.create({
          conversation: newConv._id,
          sender: host._id,
          text: `Hi ${req.user.name}! Welcome to Travelling. Let me know if you need any details about Balian treehouse!`,
        });

        // Nạp lại danh sách từ MongoDB
        conversations = await Conversation.find({
          $or: [{ host: userId }, { renter: userId }],
        })
          .populate('host', 'name email phone')
          .populate('renter', 'name email phone')
          .sort({ lastMessageTime: -1 });
      }
    }

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
    let convId = req.params.id;

    // Khắc phục nếu client truyền mock ID như 'conv-1'
    if (!mongoose.Types.ObjectId.isValid(convId)) {
      const host = await User.findOne({ email: 'jinny@gmail.com' });
      if (host) {
        const existing = await Conversation.findOne({
          $or: [
            { host: host._id, renter: userId },
            { host: userId, renter: host._id },
          ],
        });
        if (existing) {
          convId = existing._id.toString();
        } else {
          return res.status(404).json({ message: 'Hội thoại không tồn tại' });
        }
      } else {
        return res.status(404).json({ message: 'Hội thoại không tồn tại' });
      }
    }

    const conversation = await Conversation.findById(convId)
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

    const messages = await Message.find({ conversation: convId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name');

    const isHost = conversation.host._id.equals(userId);

    const formattedMessages = messages.map((m) => {
      const isSelf = m.sender && m.sender._id.equals(userId);
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
    let convId = req.params.id;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được rỗng' });
    }

    // Khắc phục nếu client truyền mock ID như 'conv-1': tự động liên kết hoặc tạo hội thoại MongoDB
    if (!mongoose.Types.ObjectId.isValid(convId)) {
      const host = await User.findOne({ email: 'jinny@gmail.com' });
      if (host) {
        let existing = await Conversation.findOne({
          $or: [
            { host: host._id, renter: userId },
            { host: userId, renter: host._id },
          ],
        });
        if (!existing) {
          existing = await Conversation.create({
            host: host._id,
            renter: userId,
            listingId: '4',
            listingTitle: 'Balian treehouse',
            listingImage:
              'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
            listingPrice: 20,
            dates: 'Inquiry',
            status: 'inquiry',
            statusLabel: 'Inquiry · Balian treehouse',
            lastMessage: (text || '').trim(),
            lastMessageTime: new Date(),
            unreadBy: [host._id],
          });
        }
        convId = existing._id.toString();
      } else {
        return res.status(404).json({ message: 'Hội thoại không tồn tại' });
      }
    }

    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      return res.status(404).json({ message: 'Hội thoại không tồn tại' });
    }

    const isMember =
      conversation.host.equals(userId) || conversation.renter.equals(userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền nhắn tin trong hội thoại này' });
    }

    // Tạo message mới trong MongoDB Atlas
    const message = await Message.create({
      conversation: convId,
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
    const formattedTime = formatTime(message.createdAt);
    const messagePayload = {
      id: message._id.toString(),
      conversationId: convId,
      sender: isHost ? 'host' : 'renter',
      senderName: req.user.name,
      text: message.text,
      image: message.image,
      time: formattedTime,
      timestamp: message.createdAt.getTime(),
    };

    // Bắn sự kiện realtime qua Socket.io
    const io = req.app.get('io');
    if (io) {
      // 1. Gửi tin nhắn tức thì vào phòng chat (room)
      io.to(convId).emit('message:received', messagePayload);
      // 2. Cập nhật preview tin nhắn cuối cùng trên màn hình danh sách Inbox
      io.emit('conversation:updated', {
        id: convId,
        lastMessage: conversation.lastMessage,
        lastMessageTime: formattedTime,
        unreadFor: otherUserId.toString(),
      });
    }

    res.status(201).json({
      message: messagePayload,
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
    let { hostId, hostEmail, listingId, listingTitle, listingImage, listingPrice } =
      req.body || {};

    if (!hostId && hostEmail) {
      const hostUser = await User.findOne({ email: String(hostEmail).toLowerCase().trim() });
      if (hostUser) hostId = hostUser._id;
    }

    if (!hostId) {
      const defaultHost = await User.findOne({ email: 'jinny@gmail.com' });
      if (defaultHost) hostId = defaultHost._id;
    }

    if (!hostId) {
      return res.status(400).json({ message: 'Không tìm thấy thông tin chủ nhà' });
    }

    // Không cho tự chat với chính mình
    if (String(hostId) === String(renterId)) {
      return res.status(400).json({ message: 'Không thể tạo cuộc trò chuyện với chính mình' });
    }

    let conversation = await Conversation.findOne({
      $or: [
        { host: hostId, renter: renterId, listingId: listingId || '' },
        { host: renterId, renter: hostId, listingId: listingId || '' },
        { host: hostId, renter: renterId },
      ],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        host: hostId,
        renter: renterId,
        listingId: listingId || '4',
        listingTitle: listingTitle || 'Balian treehouse',
        listingImage:
          listingImage ||
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
        listingPrice: listingPrice || 20,
        status: 'inquiry',
        statusLabel: `Inquiry · ${listingTitle || 'Balian treehouse'}`,
        lastMessage: 'Started conversation with host.',
        lastMessageTime: new Date(),
        unreadBy: [hostId],
      });

      // Tạo tin nhắn chào mở đầu
      await Message.create({
        conversation: conversation._id,
        sender: hostId,
        text: `Hi ${req.user.name}! Thank you for reaching out. How can I assist you with your stay?`,
      });
    }

    res.json({ conversationId: conversation._id.toString() });
  } catch (error) {
    console.error('Lỗi tạo inquiry:', error.message);
    res.status(500).json({ message: 'Không thể tạo cuộc hội thoại' });
  }
});

// 5. Lấy danh sách thành viên trong hệ thống để bắt đầu cuộc trò chuyện
router.get('/contacts', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } }).select('name email phone');
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
      })),
    });
  } catch (error) {
    console.error('Lỗi lấy contacts:', error.message);
    res.status(500).json({ message: 'Không thể tải danh sách liên hệ' });
  }
});

module.exports = router;
