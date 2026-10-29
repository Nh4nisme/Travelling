/**
 * Kiểm thử luồng booking qua các handler THẬT của routes/bookings.js và routes/listings.js,
 * chạy trên bộ giả lập mongoose/express trong bộ nhớ (xem testkit/fakeDb.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithFakes } = require('../testkit/fakeDb');

const kit = loadWithFakes();
const { call, bookingsRouter, listingsRouter, Listing, BookedNight, Booking, rules } = kit;
test.after(() => kit.restore());

const iso = (offsetDays) => rules.toDateOnly(rules.addDays(rules.todayUTC(), offsetDays));
const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
let keySeq = 0;

const book = (user, body) => call(bookingsRouter, 'POST', '/', { user, body: { listingId: '1', adults: 2, children: 0, paymentMethod: 'full', ...body } });
const nightsOf = async (listingId = '1') => (await BookedNight.find({ listingId }).sort({ night: 1 })).map((n) => rules.toDateOnly(n.night));

test.beforeEach(async () => {
  await BookedNight.deleteMany({ listingId: '1' });
  await Booking.deleteMany({});
  if (!(await Listing.findOne({ id: '1' }))) {
    await new Listing({
      id: '1', title: 'Apartment in Omaha', city: 'Omaha', country: 'USA', price: 20, maxGuests: 2,
      images: ['https://img/1.jpg'], checkInTime: '14:00', checkOutTime: '12:00',
    }).save();
  }
});

test('cần đăng nhập', async () => {
  const r = await call(bookingsRouter, 'GET', '/', {});
  assert.equal(r.status, 401);
});

test('quote: giá do server tính, kèm 2 hình thức thanh toán', async () => {
  const r = await call(bookingsRouter, 'POST', '/quote', { user: A, body: { listingId: '1', checkIn: iso(10), checkOut: iso(13), adults: 2 } });
  assert.equal(r.status, 200);
  const q = r.body.quote;
  assert.equal(q.nights, 3);
  assert.equal(q.price.subtotal, 60);
  assert.equal(q.price.total, 70);
  assert.deepEqual(q.options.full, { payNow: 70, balanceDue: 0 });
  assert.deepEqual(q.options.part, { payNow: 35, balanceDue: 35 });
});

test('quote: lỗi dữ liệu', async () => {
  const q = (body) => call(bookingsRouter, 'POST', '/quote', { user: A, body });
  assert.equal((await q({ listingId: '999', checkIn: iso(10), checkOut: iso(12), adults: 1 })).status, 404);
  assert.equal((await q({ listingId: '1', checkIn: iso(-1), checkOut: iso(2), adults: 1 })).status, 400);
  assert.equal((await q({ listingId: '1', checkIn: iso(10), checkOut: iso(10), adults: 1 })).status, 400);
  assert.equal((await q({ listingId: '1', checkIn: iso(10), checkOut: iso(12), adults: 3 })).status, 400); // quá maxGuests
  assert.equal((await q({ listingId: '1', checkIn: iso(10), checkOut: iso(12), adults: 0, children: 2 })).status, 400);
  assert.equal((await q({ checkIn: iso(10), checkOut: iso(12), adults: 1 })).status, 400);
});

test('tạo booking: lưu đúng dữ liệu và khoá từng đêm', async () => {
  const r = await book(A, { checkIn: iso(10), checkOut: iso(12) });
  assert.equal(r.status, 201);
  const b = r.body.booking;
  assert.match(b.ref, /^TRV-[A-Z2-9]{8}$/);
  assert.equal(b.stage, 'upcoming');
  assert.equal(b.nights, 2);
  assert.equal(b.price.total, 50);
  assert.equal(b.payment.status, 'paid');
  assert.equal(b.payment.amountPaid, 50);
  assert.equal(b.listing.title, 'Apartment in Omaha');
  assert.equal(b.cancellation.refundPercent, 100);
  assert.deepEqual(await nightsOf(), [iso(10), iso(11)]);
});

test('thanh toán một phần: đặt cọc 50%', async () => {
  const r = await book(A, { checkIn: iso(10), checkOut: iso(12), paymentMethod: 'part' });
  assert.equal(r.body.booking.payment.status, 'partial');
  assert.equal(r.body.booking.payment.amountPaid, 25);
  assert.equal(r.body.booking.payment.balanceDue, 25);
});

test('hình thức thanh toán sai => 400 và không khoá ngày', async () => {
  const r = await book(A, { checkIn: iso(10), checkOut: iso(12), paymentMethod: 'cash' });
  assert.equal(r.status, 400);
  assert.deepEqual(await nightsOf(), []);
});

test('đặt trùng ngày => 409', async () => {
  assert.equal((await book(A, { checkIn: iso(10), checkOut: iso(12) })).status, 201);
  const r = await book(B, { checkIn: iso(11), checkOut: iso(14) });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'DATES_UNAVAILABLE');
});

test('đặt trùng một phần: nhả lại các đêm đã khoá dở (rollback)', async () => {
  await book(A, { checkIn: iso(10), checkOut: iso(12) }); // đêm 10, 11
  const r = await book(B, { checkIn: iso(9), checkOut: iso(11) }); // đêm 9 (ok) rồi đêm 10 (trùng)
  assert.equal(r.status, 409);
  assert.deepEqual(await nightsOf(), [iso(10), iso(11)]); // đêm 9 không bị kẹt lại
  const again = await book(B, { checkIn: iso(8), checkOut: iso(10) }); // 8, 9 vẫn đặt được
  assert.equal(again.status, 201);
});

test('trả phòng và nhận phòng cùng một ngày là hợp lệ', async () => {
  assert.equal((await book(A, { checkIn: iso(10), checkOut: iso(12) })).status, 201);
  assert.equal((await book(B, { checkIn: iso(12), checkOut: iso(14) })).status, 201);
  assert.equal((await book(B, { checkIn: iso(8), checkOut: iso(10) })).status, 201);
});

test('hai người đặt cùng lúc: chỉ một người thành công', async () => {
  const [x, y] = await Promise.all([
    book(A, { checkIn: iso(20), checkOut: iso(23) }),
    book(B, { checkIn: iso(21), checkOut: iso(24) }),
  ]);
  assert.deepEqual([x.status, y.status].sort(), [201, 409]);
  assert.equal((await nightsOf()).length, 3);
});

test('idempotencyKey: gửi lại cùng khoá không tạo đơn thứ hai', async () => {
  const idempotencyKey = `key-${keySeq += 1}-abcdefgh`;
  const first = await book(A, { checkIn: iso(10), checkOut: iso(12), idempotencyKey });
  const second = await book(A, { checkIn: iso(10), checkOut: iso(12), idempotencyKey });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(second.body.booking.id, first.body.booking.id);
  assert.equal((await Booking.find({})).length, 1);
  assert.equal((await nightsOf()).length, 2);
});

test('danh sách và chi tiết chỉ thấy booking của chính mình', async () => {
  const a = (await book(A, { checkIn: iso(10), checkOut: iso(12) })).body.booking;
  await book(B, { checkIn: iso(20), checkOut: iso(22) });
  const listA = await call(bookingsRouter, 'GET', '/', { user: A });
  assert.equal(listA.body.bookings.length, 1);
  assert.equal(listA.body.bookings[0].id, a.id);
  assert.equal((await call(bookingsRouter, 'GET', `/${a.id}`, { user: A })).status, 200);
  assert.equal((await call(bookingsRouter, 'GET', `/${a.id}`, { user: B })).status, 404);
  assert.equal((await call(bookingsRouter, 'GET', '/khong-phai-id', { user: A })).status, 404);
});

test('availability: trả về các đêm đã đặt', async () => {
  await book(A, { checkIn: iso(10), checkOut: iso(13) });
  const r = await call(listingsRouter, 'GET', '/1/availability');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.bookedNights, [iso(10), iso(11), iso(12)]);
  assert.equal((await call(listingsRouter, 'GET', '/999/availability')).status, 404);
  assert.equal((await call(listingsRouter, 'GET', '/1/availability?from=abc')).status, 400);
});

test('huỷ >= 7 ngày: hoàn 100% và trả lại lịch trống', async () => {
  const b = (await book(A, { checkIn: iso(10), checkOut: iso(12) })).body.booking;
  const r = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  assert.equal(r.status, 200);
  assert.equal(r.body.booking.status, 'cancelled');
  assert.equal(r.body.booking.stage, 'cancelled');
  assert.equal(r.body.booking.payment.refundAmount, 50);
  assert.equal(r.body.booking.payment.status, 'refunded');
  assert.deepEqual(await nightsOf(), []);
  assert.equal((await book(B, { checkIn: iso(10), checkOut: iso(12) })).status, 201); // đặt lại được
  const again = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A }); // huỷ lần 2: idempotent
  assert.equal(again.status, 200);
  assert.equal(again.body.booking.payment.refundAmount, 50);
});

test('huỷ 2-6 ngày: hoàn 50% (tính trên số đã trả)', async () => {
  const b = (await book(A, { checkIn: iso(4), checkOut: iso(6), paymentMethod: 'part' })).body.booking; // đã trả cọc 25
  const r = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  assert.equal(r.body.booking.payment.refundAmount, 13); // 50% của 25, làm tròn
  assert.equal(r.body.booking.payment.status, 'partially_refunded');
  assert.equal(r.body.booking.payment.balanceDue, 0);
});

test('huỷ 1 ngày trước: được huỷ nhưng không hoàn tiền', async () => {
  const b = (await book(A, { checkIn: iso(1), checkOut: iso(3) })).body.booking;
  const r = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  assert.equal(r.status, 200);
  assert.equal(r.body.booking.payment.refundAmount, 0);
  assert.equal(r.body.booking.payment.status, 'no_refund');
});

test('không thể huỷ từ ngày nhận phòng; không huỷ được booking của người khác', async () => {
  const b = (await book(A, { checkIn: iso(0), checkOut: iso(2) })).body.booking;
  assert.equal(b.stage, 'ongoing');
  const r = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'NOT_CANCELLABLE');
  assert.equal((await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: B })).status, 404);
});

test('trả nốt số tiền còn lại', async () => {
  const b = (await book(A, { checkIn: iso(10), checkOut: iso(12), paymentMethod: 'part' })).body.booking;
  const r = await call(bookingsRouter, 'POST', `/${b.id}/pay-balance`, { user: A });
  assert.equal(r.status, 200);
  assert.equal(r.body.booking.payment.status, 'paid');
  assert.equal(r.body.booking.payment.amountPaid, 50);
  assert.equal(r.body.booking.payment.balanceDue, 0);
  assert.ok(r.body.booking.payment.balancePaidAt);
  const again = await call(bookingsRouter, 'POST', `/${b.id}/pay-balance`, { user: A }); // idempotent
  assert.equal(again.status, 200);
  assert.equal(again.body.booking.payment.amountPaid, 50);
  // sau khi trả đủ, huỷ sớm hoàn toàn bộ
  const c = await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  assert.equal(c.body.booking.payment.refundAmount, 50);
});

test('không trả nốt cho booking đã huỷ', async () => {
  const b = (await book(A, { checkIn: iso(10), checkOut: iso(12), paymentMethod: 'part' })).body.booking;
  await call(bookingsRouter, 'POST', `/${b.id}/cancel`, { user: A });
  const r = await call(bookingsRouter, 'POST', `/${b.id}/pay-balance`, { user: A });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'NOT_PAYABLE');
});
