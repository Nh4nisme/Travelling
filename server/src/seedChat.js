require('./config/loadEnv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

async function seedChat() {
  await connectDB();
  console.log('🌱 Đang khởi tạo dữ liệu Chat mẫu vào MongoDB Atlas...');

  // 1. Tìm hoặc tạo user Host Jinny Oslin
  let jinny = await User.findOne({ email: 'jinny@gmail.com' });
  if (!jinny) {
    jinny = await User.create({
      name: 'Jinny Oslin',
      email: 'jinny@gmail.com',
      phone: '0901234567',
      password: 'password123',
    });
    console.log('✅ Đã tạo Host Jinny Oslin');
  }

  // 2. Tìm hoặc tạo user Renter Sơn
  let son = await User.findOne({ email: 'nguyensonn2k5@gmail.com' });
  if (!son) {
    son = await User.create({
      name: 'Sơn',
      email: 'nguyensonn2k5@gmail.com',
      phone: '0833756579',
      password: 'password123',
    });
    console.log('✅ Đã tạo Renter Sơn');
  }

  // 3. Tìm hoặc tạo thêm khách hàng Alex Miller
  let alex = await User.findOne({ email: 'alex.miller@gmail.com' });
  if (!alex) {
    alex = await User.create({
      name: 'Alex Miller',
      email: 'alex.miller@gmail.com',
      phone: '0988776655',
      password: 'password123',
    });
    console.log('✅ Đã tạo Guest Alex Miller');
  }

  // Xóa chat cũ giữa các cặp này để làm sạch
  await Conversation.deleteMany({
    $or: [
      { host: jinny._id, renter: son._id },
      { host: jinny._id, renter: alex._id },
    ],
  });

  // 4. Tạo cuộc trò chuyện 1: Giữa Host Jinny và Renter Sơn (Inquiry về Balian treehouse)
  const conv1 = await Conversation.create({
    host: jinny._id,
    renter: son._id,
    listingId: '4',
    listingTitle: 'Balian treehouse',
    listingImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
    listingPrice: 20,
    dates: 'Inquiry · 3 nights',
    status: 'inquiry',
    statusLabel: 'Inquiry · Balian treehouse',
    lastMessage: 'Standard check-in is at 14:00. Luggage drop-off is available from 11:00 AM!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadBy: [son._id],
  });

  await Message.create([
    {
      conversation: conv1._id,
      sender: son._id,
      text: 'Chào chị Jinny! Em là Sơn (SĐT: 0833756579). Em đang tính thuê căn Balian treehouse vào tuần tới.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      conversation: conv1._id,
      sender: son._id,
      text: 'Cho em hỏi phòng có mạng wifi mạnh để họp online làm việc từ xa không ạ và giờ nhận phòng thế nào?',
      createdAt: new Date(Date.now() - 1000 * 60 * 18),
    },
    {
      conversation: conv1._id,
      sender: jinny._id,
      text: 'Chào Sơn! Mạng cáp quang tốc độ cao 150 Mbps phủ sóng toàn bộ villa, làm việc video call cực kỳ mượt mà em nhé.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      conversation: conv1._id,
      sender: jinny._id,
      text: 'Standard check-in is at 14:00. Luggage drop-off is available from 11:00 AM!',
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);
  console.log('✅ Đã tạo cuộc trò chuyện MongoDB: Jinny Oslin ↔ Sơn (Balian treehouse)');

  // 5. Tạo cuộc trò chuyện 2: Giữa Host Jinny và Alex Miller (Confirmed booking)
  const conv2 = await Conversation.create({
    host: jinny._id,
    renter: alex._id,
    listingId: '4',
    listingTitle: 'Balian treehouse',
    listingImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70',
    listingPrice: 20,
    dates: 'May 1 - 6, 2026',
    status: 'confirmed',
    statusLabel: 'Reserved · May 1 - 6',
    lastMessage: 'Thanks Jinny! We will arrive around 3 PM on May 1st.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unreadBy: [],
  });

  await Message.create([
    {
      conversation: conv2._id,
      sender: jinny._id,
      text: 'Hello Alex! We are getting everything ready for your stay on May 1st.',
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      conversation: conv2._id,
      sender: alex._id,
      text: 'Thanks Jinny! We will arrive around 3 PM on May 1st.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  ]);
  console.log('✅ Đã tạo cuộc trò chuyện MongoDB: Jinny Oslin ↔ Alex Miller');

  console.log('🎉 Hoàn tất Seed Chat vào MongoDB Atlas!');
  process.exit(0);
}

seedChat().catch((e) => {
  console.error('❌ Lỗi seed:', e.message);
  process.exit(1);
});
