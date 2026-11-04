/**
 * Script: seedHostEmails.js
 * Cập nhật hostEmail cho các listing trong MongoDB.
 * Chạy: node server/scripts/seedHostEmails.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const Listing = require('../src/models/Listing');

// Mapping listingId -> hostEmail
// Thêm vào đây khi có thêm listing mới
const HOST_MAP = {
  '1': 'jinny@gmail.com',
  '2': 'jinny@gmail.com',
  '3': 'jinny@gmail.com',
  '4': 'jinny@gmail.com', // Balian treehouse - Jinny Oslin
  '5': 'jinny@gmail.com',
  '6': 'jinny@gmail.com',
  '7': 'jinny@gmail.com',
  '8': 'jinny@gmail.com',
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  let updated = 0;
  for (const [id, email] of Object.entries(HOST_MAP)) {
    const result = await Listing.updateOne({ id }, { $set: { hostEmail: email } });
    if (result.modifiedCount > 0) {
      console.log(`  → Listing ${id}: hostEmail = ${email}`);
      updated++;
    } else {
      console.log(`  ⚠️  Listing ${id}: không tìm thấy hoặc đã có sẵn`);
    }
  }

  console.log(`\n✅ Done — ${updated} listing(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
