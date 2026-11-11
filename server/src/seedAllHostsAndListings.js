const User = require('./models/User');
const Listing = require('./models/Listing');
const listingsData = require('./data/listings.json');

const HOST_USERS = [
  { name: 'Jinny Oslin', email: 'jinny@gmail.com', phone: '0901234567' },
  { name: 'Pierre Dubois', email: 'pierre.chalet@gmail.com', phone: '+33 4 50 53 00 21' },
  { name: 'Marco Rossi', email: 'marco.dolomites@gmail.com', phone: '+39 0436 12345' },
  { name: 'Minh Đức', email: 'minhduc.dalat@gmail.com', phone: '0912345678' },
  { name: 'Sarah Jenkins', email: 'sarah.omaha@gmail.com', phone: '+1 402 555 0199' },
  { name: 'Alex Miller', email: 'alex.miller@gmail.com', phone: '+1 408 555 0144' },
  { name: 'David Tremblay', email: 'david.banff@gmail.com', phone: '+1 403 555 0188' },
  { name: 'Sơn', email: 'nguyensonn2k5@gmail.com', phone: '0833756579' },
  { name: 'tien Chay Go', email: 'anhba@gmail.com', phone: '0933221100' },
];

async function seedAllHostsAndListings() {
  // 1. Khởi tạo tất cả tài khoản Host & Guest nếu chưa có (chạy êm không in log)
  for (const u of HOST_USERS) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    if (!existing) {
      await User.create({
        name: u.name,
        email: u.email.toLowerCase(),
        phone: u.phone,
        password: 'password123',
      });
    } else {
      if (existing.name !== u.name) {
        existing.name = u.name;
        await existing.save();
      }
    }
  }

  // 2. Cập nhật đầy đủ thông tin căn hộ, bảo tồn và tính toán chính xác reviews thực tế (loại bỏ dữ liệu fake)
  const FAKE_AUTHORS = [
    'John King', 'Jennifer Harris', 'John Edwards', 'Elizabeth Lopez',
    'Michael Chang', 'Sarah Miller', 'David Wilson', 'Emily Clark',
    'Brian Taylor', 'Sophie Martin', 'Liam Davies', 'Chloe Dubois',
    'Lucas Bernard', 'Emma Watson', 'Thomas Petit', 'Matteo Ricci',
    'Laura Bianchi', 'Andrea Costa', 'Trần Văn Nam', 'Nguyễn Thị Mai',
    'Hoàng Long', 'Jessica Brown', 'Daniel Smith', 'Olivia Taylor',
    'Jinny Oslin',
  ];

  for (const item of listingsData) {
    const existing = await Listing.findOne({ id: item.id });
    const rawItems = (existing && existing.reviewItems) ? existing.reviewItems : (item.reviewItems || []);
    const reviewItems = rawItems.filter((r) => !FAKE_AUTHORS.includes(r.name));
    
    const reviews = reviewItems.length;
    const totalStars = reviewItems.reduce((sum, r) => sum + r.stars, 0);
    const rating = reviews > 0 ? Number((totalStars / reviews).toFixed(1)) : 5;

    await Listing.updateOne(
      { id: item.id },
      {
        $set: {
          title: item.title,
          city: item.city,
          country: item.country,
          region: item.region,
          category: item.category,
          type: item.type,
          price: item.price,
          rating: rating,
          reviews: reviews,
          reviewItems: reviewItems,
          bedrooms: item.bedrooms,
          beds: item.beds,
          baths: item.baths,
          maxGuests: item.maxGuests,
          images: item.images,
          facilities: item.facilities,
          desc: item.desc,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          checkInPolicy: item.checkInPolicy,
          latitude: item.latitude,
          longitude: item.longitude,
          hostEmail: item.hostEmail,
          hostName: item.hostName,
        },
      },
      { upsert: true }
    );
  }
}

module.exports = seedAllHostsAndListings;
