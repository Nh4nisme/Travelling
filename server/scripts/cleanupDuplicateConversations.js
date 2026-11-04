/**
 * Script: cleanupDuplicateConversations.js
 * Xóa các conversation trùng (cùng cặp host-renter) trong MongoDB.
 * Giữ lại conversation cũ nhất cho mỗi cặp.
 * Chạy: node server/scripts/cleanupDuplicateConversations.js
 */
require('../src/config/loadEnv');
const mongoose = require('mongoose');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Tìm tất cả conversations, group theo cặp host-renter
  const all = await Conversation.find({}).sort({ createdAt: 1 }).lean();
  
  // Map: "hostId|renterId" (normalized) -> [conversations]
  const groupMap = new Map();
  for (const c of all) {
    // Normalize key: luôn sort 2 id để cặp A-B và B-A cùng key
    const ids = [c.host.toString(), c.renter.toString()].sort();
    const key = ids.join('|');
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(c);
  }

  let deletedConvs = 0;
  let deletedMsgs = 0;

  for (const [key, group] of groupMap.entries()) {
    if (group.length <= 1) continue;
    console.log(`\n⚠️  Cặp ${key} có ${group.length} conversation trùng:`);
    group.forEach((c, i) => console.log(`   [${i}] id=${c._id} listing=${c.listingId} created=${c.createdAt}`));
    
    // Giữ lại cái cũ nhất (index 0, đã sort by createdAt asc)
    const toDelete = group.slice(1).map((c) => c._id);
    
    // Xóa messages trước
    const msgResult = await Message.deleteMany({ conversation: { $in: toDelete } });
    deletedMsgs += msgResult.deletedCount;
    
    // Xóa conversations trùng
    const convResult = await Conversation.deleteMany({ _id: { $in: toDelete } });
    deletedConvs += convResult.deletedCount;
    
    console.log(`   → Đã giữ lại: ${group[0]._id}`);
    console.log(`   → Đã xóa: ${convResult.deletedCount} conversation, ${msgResult.deletedCount} messages`);
  }

  console.log(`\n✅ Hoàn thành! Đã xóa ${deletedConvs} conversation trùng và ${deletedMsgs} messages liên quan.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
