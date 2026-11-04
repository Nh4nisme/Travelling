/**
 * Script: clearAllChatHistory.js
 * Xóa sạch 100% cuộc hội thoại và tin nhắn trong MongoDB Atlas.
 * Chạy lệnh: node server/scripts/clearAllChatHistory.js
 */
require('../src/config/loadEnv');
const mongoose = require('mongoose');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Đã kết nối MongoDB Atlas');

  const beforeC = await Conversation.countDocuments();
  const beforeM = await Message.countDocuments();
  console.log(`📊 Hiện có: ${beforeC} cuộc trò chuyện, ${beforeM} tin nhắn`);

  const delM = await Message.deleteMany({});
  const delC = await Conversation.deleteMany({});

  console.log(`\n🎉 THÀNH CÔNG: Đã xóa ${delC.deletedCount} cuộc trò chuyện và ${delM.deletedCount} tin nhắn!`);
  console.log('👉 Bây giờ không còn lịch sử chat nào trong hệ thống.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Lỗi:', e.message);
  process.exit(1);
});
