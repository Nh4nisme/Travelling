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
    const convId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(convId)) {
      return res.status(404).json({ message: 'Hội thoại không tồn tại' });
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
    const convId = req.params.id;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được rỗng' });
    }

    if (!mongoose.Types.ObjectId.isValid(convId)) {
      return res.status(400).json({ message: 'ID hội thoại không hợp lệ' });
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
      // Global broadcast: đảm bảo thiết bị vật lý nhận được realtime dù chưa join room
      io.emit('message:received', messagePayload);
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

    // Ưu tiên 1: nếu có listingId, tìm listing trong DB để lấy đúng thông tin và host của căn hộ đó
    if (listingId) {
      const Listing = require('../models/Listing');
      const listing = await Listing.findOne({ id: String(listingId) }).select('hostEmail hostName title images price');
      if (listing) {
        if (!listingTitle) listingTitle = listing.title;
        if (!listingImage && listing.images && listing.images[0]) listingImage = listing.images[0];
        if (!listingPrice) listingPrice = listing.price;
        if (!hostEmail && listing.hostEmail) hostEmail = listing.hostEmail;
      }
    }

    // Ưu tiên 2: tìm host theo hostEmail
    if (!hostId && hostEmail) {
      const hostUser = await User.findOne({ email: String(hostEmail).toLowerCase().trim() });
      if (hostUser) hostId = hostUser._id;
    }

    // Ưu tiên 3: Fallback Jinny Oslin nếu không tìm được
    if (!hostId) {
      const defaultHost = await User.findOne({ email: 'jinny@gmail.com' });
      if (defaultHost) hostId = defaultHost._id;
    }

    if (!hostId) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin chủ nhà cho căn hộ này' });
    }

    // Kiểm tra: không cho tự chat với chính mình
    if (String(hostId) === String(renterId)) {
      return res.status(400).json({
        message: 'Bạn là chủ nhà của căn hộ này! Hãy đăng nhập tài khoản khách khác (ví dụ: nguyensonn2k5@gmail.com) để thử nghiệm nhắn tin cho chủ nhà.',
      });
    }

    // Tìm cuộc hội thoại đã tồn tại giữa 2 người này cho căn hộ này (hoặc giữa 2 người này)
    let conversation = await Conversation.findOne({
      $or: [
        { host: hostId, renter: renterId, listingId: listingId || '' },
        { host: renterId, renter: hostId, listingId: listingId || '' },
        { host: hostId, renter: renterId },
        { host: renterId, renter: hostId },
      ],
    }).sort({ createdAt: 1 });

    // Nếu tìm thấy, kiểm tra xem có duplicate không và dọn dẹp
    if (conversation) {
      const allConvs = await Conversation.find({
        $or: [
          { host: hostId, renter: renterId, listingId: listingId || '' },
          { host: renterId, renter: hostId, listingId: listingId || '' },
          { host: hostId, renter: renterId },
          { host: renterId, renter: hostId },
        ],
      }).sort({ createdAt: 1 });

      if (allConvs.length > 1) {
        const toDelete = allConvs.slice(1).map((c) => c._id);
        await Message.deleteMany({ conversation: { $in: toDelete } });
        await Conversation.deleteMany({ _id: { $in: toDelete } });
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({
        host: hostId,
        renter: renterId,
        listingId: listingId || '4',
        listingTitle: listingTitle || 'Property',
        listingImage:
          listingImage ||
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
        listingPrice: listingPrice || 20,
        status: 'inquiry',
        statusLabel: `Inquiry · ${listingTitle || 'Property'}`,
        lastMessage: 'Chưa có tin nhắn',
        lastMessageTime: new Date(),
        unreadBy: [],
      });
      // Không tạo tin nhắn tự động để giữ lịch sử chat trống ban đầu
    }

    res.json({ conversationId: conversation._id.toString() });
  } catch (error) {
    console.error('Lỗi tạo inquiry:', error.message);
    res.status(500).json({ message: 'Không thể tạo cuộc hội thoại' });
  }
});

// 5. Tìm kiếm người dùng bằng Số điện thoại hoặc Email (bảo mật, không lộ toàn bộ danh bạ)
router.get('/search-user', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại hoặc email' });
    }

    const cleanQuery = query.trim().toLowerCase();

    // Không cho tự tìm chính mình
    const currentUser = await User.findById(currentUserId);
    if (
      (currentUser?.email && currentUser.email.toLowerCase() === cleanQuery) ||
      (currentUser?.phone && currentUser.phone.trim() === cleanQuery)
    ) {
      return res.status(400).json({ message: 'Bạn không thể tự thêm chính mình' });
    }

    // Tìm kiếm chính xác email hoặc số điện thoại
    const user = await User.findOne({
      _id: { $ne: currentUserId },
      $or: [
        { email: cleanQuery },
        { phone: cleanQuery },
      ],
    }).select('name email phone');

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với số điện thoại hoặc email này' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Lỗi tìm kiếm user:', error.message);
    res.status(500).json({ message: 'Không thể tìm kiếm người dùng' });
  }
});

// Endpoint contacts cũ: trả về rỗng để bảo mật thông tin người dùng
router.get('/contacts', auth, async (_req, res) => {
  res.json({ users: [] });
});

// 6. Xóa sạch 100% lịch sử chat (cho testing / reset dữ liệu)
router.post('/clear-all', auth, async (_req, res) => {
  try {
    const cResult = await Conversation.deleteMany({});
    const mResult = await Message.deleteMany({});
    res.json({
      ok: true,
      message: 'Đã xóa toàn bộ lịch sử trò chuyện trong hệ thống.',
      deletedConversations: cResult.deletedCount,
      deletedMessages: mResult.deletedCount,
    });
  } catch (error) {
    console.error('Lỗi xóa lịch sử chat:', error.message);
    res.status(500).json({ message: 'Không thể xóa lịch sử trò chuyện' });
  }
});

module.exports = router;
