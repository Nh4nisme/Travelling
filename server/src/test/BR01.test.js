/**
 * Unit Test cho BR01: Hai booking trạng thái PENDING/CONFIRMED 
 * của cùng một phòng không được chồng khoảng [check_in, check_out]
 * 
 * Coverage:
 * - Code 1 (assertAvailable): lines 26-29 trong bookings.js
 * - Code 2 (insertMany + rollback): lines 137-152 trong bookings.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithFakes } = require('../testkit/fakeDb');

const kit = loadWithFakes();
const { call, bookingsRouter, BookedNight, Booking, Listing, User, rules } = kit;
test.after(() => kit.restore());

const iso = (offsetDays) => rules.toDateOnly(rules.addDays(rules.todayUTC(), offsetDays));
const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const book = (user, body) => call(bookingsRouter, 'POST', '/', { 
  user, 
  body: { 
    listingId: '1', 
    adults: 2, 
    children: 0, 
    paymentMethod: 'full', 
    paymentPin: '123456', 
    ...body 
  } 
});

test.beforeEach(async () => {
  await BookedNight.deleteMany({ listingId: '1' });
  await Booking.deleteMany({});
  await User.deleteMany({});

  const userA = new User({ _id: A, name: 'Alice', email: 'alice@test.com', paymentPinSet: true, paymentPin: 'hashed' });
  userA.comparePaymentPin = async () => true;
  await userA.save();

  const userB = new User({ _id: B, name: 'Bob', email: 'bob@test.com', paymentPinSet: true, paymentPin: 'hashed' });
  userB.comparePaymentPin = async () => true;
  await userB.save();

  if (!(await Listing.findOne({ id: '1' }))) {
    await new Listing({
      id: '1', title: 'Test Apartment', city: 'City', country: 'Country', 
      price: 20, maxGuests: 2, images: ['img.jpg'], 
      checkInTime: '14:00', checkOutTime: '12:00',
    }).save();
  }
});

// ============ BẢO PHÚ NHÁNH ĐOẠN CODE 1 (assertAvailable) ============

test('[BR01-Code1-TC1] if taken (T) - có bản ghi → unavailable', async () => {
  // Arrange: Đặt booking trước để có BookedNight trong DB
  const r1 = await book(A, { checkIn: iso(10), checkOut: iso(12) });
  assert.equal(r1.status, 201);
  
  // Act: Đặt booking chồng lấn
  const r2 = await book(B, { checkIn: iso(11), checkOut: iso(13) });
  
  // Assert: Phải trả 409 DATES_UNAVAILABLE (line 28 throw unavailable)
  assert.equal(r2.status, 409);
  assert.equal(r2.body.code, 'DATES_UNAVAILABLE');
});

test('[BR01-Code1-TC2] if !taken (F) - null → Chạy xong và không báo lỗi', async () => {
  // Arrange: DB trống, không có BookedNight nào
  
  // Act: Đặt booking mới
  const r = await book(A, { checkIn: iso(10), checkOut: iso(12) });
  
  // Assert: Thành công, không throw error (line 28 không chạy)
  assert.equal(r.status, 201);
  assert.ok(r.body.booking.ref);
});

// ============ BẢO PHÚ NHÁNH ĐOẠN CODE 2 (insertMany + error handling) ============

test('[BR01-Code2-TC1] Ghi thành công - insertMany OK, không gọi deleteMany', async () => {
  // Act
  const r = await book(A, { checkIn: iso(10), checkOut: iso(12) });
  
  // Assert: Thành công, nights được insert
  assert.equal(r.status, 201);
  const nights = await BookedNight.find({ listingId: '1' }).sort({ night: 1 });
  assert.equal(nights.length, 2);
  assert.equal(rules.toDateOnly(nights[0].night), iso(10));
  assert.equal(rules.toDateOnly(nights[1].night), iso(11));
});

test('[BR01-Code2-TC2] Lỗi khác với lỗi trùng khóa → Gọi deleteMany, ném lại lỗi gốc', async () => {
  // Arrange: Mock insertMany throw error không phải duplicate key
  const originalInsertMany = BookedNight.insertMany;
  let deleteCalled = false;
  
  BookedNight.insertMany = async () => {
    const err = new Error('Database connection error');
    err.code = 500; // Không phải 11000
    throw err;
  };
  
  const originalDeleteMany = BookedNight.deleteMany;
  BookedNight.deleteMany = async (query) => {
    if (query.booking) deleteCalled = true;
    return originalDeleteMany.call(BookedNight, query);
  };
  
  try {
    // Act
    const r = await book(A, { checkIn: iso(10), checkOut: iso(12) });
    
    // Assert: Lỗi 500, deleteMany được gọi
    assert.equal(r.status, 500);
    assert.equal(deleteCalled, true);
  } finally {
    // Cleanup
    BookedNight.insertMany = originalInsertMany;
    BookedNight.deleteMany = originalDeleteMany;
  }
});

test('[BR01-Code2-TC3] Trùng khóa + Không có key → Gọi deleteMany, ném unavailable', async () => {
  // Arrange: Đặt booking trước
  await book(A, { checkIn: iso(10), checkOut: iso(12) });
  
  // Act: Đặt trùng một phần (đêm 9 ok, đêm 10 trùng)
  const r = await book(B, { checkIn: iso(9), checkOut: iso(11) });
  
  // Assert: 409, đêm 9 đã bị rollback (deleteMany)
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'DATES_UNAVAILABLE');
  
  const nights = await BookedNight.find({ listingId: '1' }).sort({ night: 1 });
  assert.equal(nights.length, 2); // Chỉ còn đêm 10, 11 của booking A
  assert.equal(rules.toDateOnly(nights[0].night), iso(10));
});

test('[BR01-Code2-TC4] Trùng khóa + Có key + Không tìm thấy → Gọi deleteMany, ném unavailable', async () => {
  // Arrange: Đặt booking trước
  await book(A, { checkIn: iso(10), checkOut: iso(12) });
  
  // Act: Đặt trùng với idempotencyKey nhưng không tìm thấy booking cũ
  const r = await book(B, { 
    checkIn: iso(9), 
    checkOut: iso(11),
    idempotencyKey: 'key-notfound-12345678'
  });
  
  // Assert: 409, sleep 300ms rồi tìm lại nhưng không có
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'DATES_UNAVAILABLE');
});

test('[BR01-Code2-TC5] Trùng khóa + Có key + Tìm thấy booking cũ → Trả 200 kèm booking cũ', async () => {
  // Arrange: Tạo booking với idempotencyKey
  const key = 'key-duplicate-12345678';
  const r1 = await book(A, { 
    checkIn: iso(10), 
    checkOut: iso(12),
    idempotencyKey: key
  });
  assert.equal(r1.status, 201);
  const bookingId = r1.body.booking.id;
  
  // Act: Gửi lại request với cùng key
  const r2 = await book(A, { 
    checkIn: iso(10), 
    checkOut: iso(12),
    idempotencyKey: key
  });
  
  // Assert: Trả 200 (không phải 201), cùng booking ID
  assert.equal(r2.status, 200);
  assert.equal(r2.body.booking.id, bookingId);
  
  // Chỉ có 1 booking trong DB
  const allBookings = await Booking.find({});
  assert.equal(allBookings.length, 1);
});
