const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const BookedNight = require('../models/BookedNight');
const rules = require('../services/bookingRules');

const { httpError, isDuplicateKey } = rules;
const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.use(auth);

async function loadListing(listingId) {
  if (typeof listingId !== 'string' || !listingId.trim()) throw httpError(400, 'listingId is required.', 'VALIDATION');
  const listing = await Listing.findOne({ id: listingId.trim() }).lean();
  if (!listing) throw httpError(404, 'Place not found.', 'LISTING_NOT_FOUND');
  return listing;
}

const unavailable = () => httpError(409, 'Those dates are no longer available. Please choose different dates.', 'DATES_UNAVAILABLE');

async function assertAvailable(listingId, stay) {
  const taken = await BookedNight.exists({ listingId, night: { $gte: stay.checkIn, $lt: stay.checkOut } });
  if (taken) throw unavailable();
}

function buildQuote(listing, stay) {
  const price = rules.priceStay(listing.price, stay.nights);
  return {
    listingId: listing.id,
    checkIn: rules.toDateOnly(stay.checkIn),
    checkOut: rules.toDateOnly(stay.checkOut),
    nights: stay.nights,
    adults: stay.adults,
    children: stay.children,
    guests: stay.adults + stay.children,
    price,
    options: rules.paymentOptions(price.total),
  };
}

async function findOwned(req) {
  const { id } = req.params;
  const booking = mongoose.isValidObjectId(id) ? await Booking.findOne({ _id: id, user: req.user._id }) : null;
  if (!booking) throw httpError(404, 'Booking not found.', 'NOT_FOUND');
  return booking;
}

async function saveWithUniqueRef(booking) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    booking.ref = rules.generateRef();
    try {
      await booking.save();
      return;
    } catch (err) {
      if (isDuplicateKey(err) && err.keyPattern?.ref) continue; // trùng mã tham chiếu (cực hiếm) -> sinh mã khác
      throw err;
    }
  }
  throw httpError(500, 'Could not generate a booking reference. Please try again.', 'ERROR');
}

// POST /api/bookings/quote  - báo giá + kiểm tra ngày còn trống (không tạo gì)
router.post('/quote', wrap(async (req, res) => {
  const listing = await loadListing(req.body?.listingId);
  const stay = rules.parseStay(req.body, listing, rules.todayUTC());
  await assertAvailable(listing.id, stay);
  res.json({ quote: buildQuote(listing, stay) });
}));

// POST /api/bookings  - tạo booking
router.post('/', wrap(async (req, res) => {
  const body = req.body || {};
  const today = rules.todayUTC();
  const key = rules.normalizeKey(body.idempotencyKey);
  const findByKey = () => (key ? Booking.findOne({ user: req.user._id, idempotencyKey: key }) : null);

  const replay = await findByKey();
  if (replay) return res.status(200).json({ booking: replay.toPublic(today) });

  const listing = await loadListing(body.listingId);
  const stay = rules.parseStay(body, listing, today);
  const price = rules.priceStay(listing.price, stay.nights);
  const payment = rules.paymentFor(body.paymentMethod, price.total);

  const booking = new Booking({
    ref: rules.generateRef(),
    user: req.user._id,
    listingId: listing.id,
    listing: {
      title: listing.title, city: listing.city, country: listing.country, image: listing.images?.[0] ?? '',
      price: listing.price, checkInTime: listing.checkInTime, checkOutTime: listing.checkOutTime,
    },
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    nights: stay.nights,
    adults: stay.adults,
    children: stay.children,
    price,
    payment,
    status: 'confirmed',
    idempotencyKey: key ?? undefined,
  });

  // Bước 1: "khoá" từng đêm. Trùng khoá => có người đặt trước => 409, và nhả các đêm đã khoá dở.
  const nights = rules.eachNight(stay.checkIn, stay.nights).map((night) => ({ listingId: listing.id, night, booking: booking._id }));
  try {
    await BookedNight.insertMany(nights, { ordered: true });
  } catch (err) {
    await BookedNight.deleteMany({ booking: booking._id });
    if (isDuplicateKey(err)) {
      if (key) { // có thể chính yêu cầu trước đó (cùng khoá) vừa thành công
        await sleep(300);
        const again = await findByKey();
        if (again) return res.status(200).json({ booking: again.toPublic(today) });
      }
      throw unavailable();
    }
    throw err;
  }

  // Bước 2: lưu booking. Lỗi gì thì nhả các đêm đã khoá để không bị "kẹt" lịch.
  try {
    await saveWithUniqueRef(booking);
  } catch (err) {
    await BookedNight.deleteMany({ booking: booking._id }).catch(() => {});
    throw err;
  }
  res.status(201).json({ booking: booking.toPublic(today) });
}));

// GET /api/bookings  - booking của người đang đăng nhập
router.get('/', wrap(async (req, res) => {
  const today = rules.todayUTC();
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(200);
  res.json({ bookings: bookings.map((b) => b.toPublic(today)) });
}));

// GET /api/bookings/:id
router.get('/:id', wrap(async (req, res) => {
  const booking = await findOwned(req);
  res.json({ booking: booking.toPublic(rules.todayUTC()) });
}));

// POST /api/bookings/:id/pay-balance  - trả nốt số tiền còn lại của đơn "trả một phần" (thanh toán giả lập)
router.post('/:id/pay-balance', wrap(async (req, res) => {
  const today = rules.todayUTC();
  const booking = await findOwned(req);
  const stage = rules.stageOf(booking.status, booking.checkIn, booking.checkOut, today);
  if (booking.status !== 'confirmed' || stage === 'completed') {
    throw httpError(400, 'This booking can no longer be paid.', 'NOT_PAYABLE');
  }
  if (booking.payment.status === 'paid') return res.json({ booking: booking.toPublic(today) }); // đã trả đủ: idempotent
  if (booking.payment.status !== 'partial' || !(booking.payment.balanceDue > 0)) {
    throw httpError(400, 'There is no remaining balance to pay.', 'NOT_PAYABLE');
  }
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, user: req.user._id, status: 'confirmed', 'payment.status': 'partial' },
    { $set: { 'payment.status': 'paid', 'payment.amountPaid': booking.price.total, 'payment.balanceDue': 0, 'payment.balancePaidAt': new Date() } },
    { new: true },
  );
  const finalDoc = updated || (await Booking.findById(booking._id));
  res.json({ booking: finalDoc.toPublic(today) });
}));

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', wrap(async (req, res) => {
  const today = rules.todayUTC();
  const booking = await findOwned(req);

  if (booking.status === 'cancelled') { // gọi lại thì idempotent, đồng thời dọn nốt các đêm nếu lần trước lỗi giữa chừng
    await BookedNight.deleteMany({ booking: booking._id });
    return res.json({ booking: booking.toPublic(today) });
  }

  const info = rules.cancellationInfo({ status: booking.status, checkIn: booking.checkIn, amountPaid: booking.payment.amountPaid }, today);
  if (!info.allowed) throw httpError(400, info.reason, 'NOT_CANCELLABLE');

  const paid = booking.payment.amountPaid;
  const paymentStatus = info.refundAmount <= 0 ? 'no_refund' : info.refundAmount >= paid ? 'refunded' : 'partially_refunded';

  // Chuyển trạng thái "nguyên tử": nếu 2 yêu cầu huỷ chạy song song thì chỉ 1 yêu cầu được hoàn tiền.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, user: req.user._id, status: 'confirmed' },
    { $set: { status: 'cancelled', cancelledAt: new Date(), 'payment.refundAmount': info.refundAmount, 'payment.status': paymentStatus, 'payment.balanceDue': 0 } },
    { new: true },
  );
  await BookedNight.deleteMany({ booking: booking._id }); // trả lại lịch trống
  const finalDoc = updated || (await Booking.findById(booking._id));
  res.json({ booking: finalDoc.toPublic(today) });
}));

router.use((err, _req, res, next) => {
  if (err && err.status) return res.status(err.status).json({ message: err.message, code: err.code });
  return next(err);
});

module.exports = router;
