const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const BookedNight = require('../models/BookedNight');
const auth = require('../middleware/auth');
const rules = require('../services/bookingRules');

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeListingReviews(listing) {
  const items = listing.reviewItems || [];
  const reviews = items.length;
  const totalStars = items.reduce((sum, r) => sum + r.stars, 0);
  const rating = reviews > 0 ? Number((totalStars / reviews).toFixed(1)) : (listing.rating || 5);
  return {
    ...listing,
    reviews,
    rating,
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const listings = await Listing.find().sort({ id: 1 }).lean();
    res.json(listings.map(({ _id, ...listing }) => normalizeListingReviews(listing)));
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const minPrice = req.query.minPrice === undefined ? 0 : Number(req.query.minPrice);
    const maxPrice = req.query.maxPrice === undefined ? Number.MAX_SAFE_INTEGER : Number(req.query.maxPrice);
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
      return res.status(400).json({ message: 'Invalid price range' });
    }

    const query = {};
    const term = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const region = typeof req.query.region === 'string' ? req.query.region : '';
    if (term) {
      const matcher = new RegExp(escapeRegex(term), 'i');
      query.$or = [{ title: matcher }, { city: matcher }, { country: matcher }];
    }
    if (region && region !== 'Anywhere') query.region = region;
    if (typeof req.query.category === 'string' && req.query.category) query.category = req.query.category;
    query.price = { $gte: minPrice, $lte: maxPrice };

    const types = typeof req.query.types === 'string' ? req.query.types.split(',').filter(Boolean) : [];
    const facilities = typeof req.query.facilities === 'string' ? req.query.facilities.split(',').filter(Boolean) : [];
    if (types.length) query.type = { $in: types };
    if (facilities.length) query.facilities = { $all: facilities };

    const listings = await Listing.find(query).sort({ id: 1 }).lean();
    res.json(listings.map(({ _id, ...listing }) => normalizeListingReviews(listing)));
  } catch (error) {
    next(error);
  }
});

// GET /api/listings/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Trả về các ĐÊM đã có người đặt (khách có thể nhận phòng đúng ngày khách trước trả phòng).
router.get('/:id/availability', async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ id: req.params.id }).select('id').lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const today = rules.todayUTC();
    const from = req.query.from === undefined ? today : rules.parseDateOnly(req.query.from);
    const to = req.query.to === undefined ? rules.addDays(today, rules.MAX_ADVANCE_DAYS + rules.MAX_NIGHTS) : rules.parseDateOnly(req.query.to);
    if (!from || !to || to < from || rules.diffDays(from, to) > 800) {
      return res.status(400).json({ message: 'Invalid date range' });
    }
    const nights = await BookedNight.find({ listingId: listing.id, night: { $gte: from, $lte: to } })
      .select('night -_id').sort({ night: 1 }).lean();
    res.json({ listingId: listing.id, from: rules.toDateOnly(from), to: rules.toDateOnly(to), bookedNights: nights.map((n) => rules.toDateOnly(n.night)) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    let listing = await Listing.findOne({ id: req.params.id }).lean();
    if (!listing && mongoose.isValidObjectId(req.params.id)) {
      listing = await Listing.findById(req.params.id).lean();
    }
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const { _id, ...result } = listing;
    res.json(normalizeListingReviews(result));
  } catch (error) {
    next(error);
  }
});

// POST /api/listings/:id/reviews - Thêm hoặc cập nhật review mới
router.post('/:id/reviews', auth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const listingId = req.params.id;
    const { stars, text } = req.body;

    // Validate input
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Stars must be between 1 and 5' });
    }
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ message: 'Review text must be at least 10 characters' });
    }

    // Import Booking model tại đây
    const Booking = require('../models/Booking');
    
    // Tìm booking của user cho listing này nếu có
    const booking = await Booking.findOne({
      user: userId,
      listingId: String(listingId),
      status: 'confirmed',
    }).sort({ checkOut: -1 });

    // Trong môi trường production, yêu cầu người dùng phải có đặt phòng trước đó
    if (!booking && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'You must have booked this property to leave a review',
        code: 'NO_BOOKING'
      });
    }

    // Import User model
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Tìm listing theo string id hoặc ObjectId
    let listing = await Listing.findOne({ id: listingId });
    if (!listing && mongoose.isValidObjectId(listingId)) {
      listing = await Listing.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check nếu user đã review listing này trước đó: nếu có thì cập nhật, chưa thì thêm mới
    const existingIndex = listing.reviewItems.findIndex(
      (r) => r.name.trim().toLowerCase() === user.name.trim().toLowerCase()
    );

    const avatarId = (user.name.charCodeAt(0) % 70) + 1;
    const reviewData = {
      name: user.name,
      stars: Number(stars),
      text: text.trim(),
      avatar: existingIndex >= 0 ? listing.reviewItems[existingIndex].avatar : avatarId,
    };

    if (existingIndex >= 0) {
      listing.reviewItems[existingIndex] = reviewData;
    } else {
      listing.reviewItems.unshift(reviewData);
    }

    // Cập nhật rating và reviews count trung thực theo số lượng reviewItems
    const totalStars = listing.reviewItems.reduce((sum, r) => sum + r.stars, 0);
    listing.reviews = listing.reviewItems.length;
    listing.rating = listing.reviews > 0 ? Number((totalStars / listing.reviews).toFixed(1)) : 5;
    
    await listing.save();

    res.status(201).json({
      message: 'Review added successfully',
      review: reviewData,
      listing: {
        id: listing.id,
        rating: listing.rating,
        reviews: listing.reviews,
        reviewItems: listing.reviewItems,
      },
    });
  } catch (error) {
    console.error('Lỗi thêm review:', error.message);
    res.status(500).json({ message: 'Failed to add review' });
  }
});

// GET /api/listings/:id/reviews - Lấy danh sách reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const listingId = req.params.id;
    let listing = await Listing.findOne({ id: listingId });
    if (!listing && mongoose.isValidObjectId(listingId)) {
      listing = await Listing.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const reviewItems = listing.reviewItems || [];
    const totalStars = reviewItems.reduce((sum, r) => sum + r.stars, 0);
    const reviewsCount = reviewItems.length;
    const rating = reviewsCount > 0 ? Number((totalStars / reviewsCount).toFixed(1)) : (listing.rating || 5);

    res.json({
      reviews: reviewItems,
      rating,
      reviewsCount,
    });
  } catch (error) {
    console.error('Lỗi lấy reviews:', error.message);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

module.exports = router;
