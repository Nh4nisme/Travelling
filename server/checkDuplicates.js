require('./src/config/loadEnv');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const Conversation = require('./src/models/Conversation');

  // Tìm tất cả user có email jinny
  const jinnys = await User.find({ email: 'jinny@gmail.com' }).select('_id name email createdAt');
  console.log('=== JINNY USERS ===');
  console.log(JSON.stringify(jinnys, null, 2));

  // Tìm tất cả conversations của tien Chay Go
  const tien = await User.findOne({ email: 'anhba@gmail.com' }).select('_id name');
  console.log('\n=== tien Chay Go ===');
  console.log(JSON.stringify(tien));

  if (tien) {
    const convs = await Conversation.find({
      $or: [{ host: tien._id }, { renter: tien._id }]
    }).populate('host', 'name email').populate('renter', 'name email').select('_id host renter listingId createdAt');
    console.log('\n=== CONVERSATIONS ===');
    convs.forEach(c => {
      console.log(`id=${c._id} | host=${c.host?.name}(${c.host?.email}) | renter=${c.renter?.name}(${c.renter?.email}) | listing=${c.listingId} | created=${c.createdAt}`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
