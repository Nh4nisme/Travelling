/**
 * Unit Test cho BR05: Chỉ booking COMPLETED mới được đánh giá, mỗi booking một đánh giá
 * 
 * Coverage:
 * - Đoạn code 1: stageOf function (lines 131-136 trong bookingRules.js)
 *   CFG: 1-2 -> 3 -> 4 -> 5 -> 6 -> 7
 * - Đoạn code 2: POST /:id/reviews (lines 145-184 trong listings.js)
 *   CFG: 1-2 -> 3 (prod check) -> 4 -> 5/7/8/20; 1-2 -> 10 (dev check) -> 11 -> 12/13/14/15/16/18/19/20
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../services/bookingRules');
const { loadWithFakes } = require('../testkit/fakeDb');

// =========================================================================
// ============================= ĐOẠN CODE 1 ===============================
// =========================================================================

test('[BR05-Code1-TC1] "cancelled"', () => {
  const expected = 'cancelled';
  const actual = rules.stageOf('cancelled', '2026-11-15', '2026-11-17', '2026-11-10');

  console.log(`\n  [BR05-Code1-TC1]`);
  console.log(`    Line number executed: 1-2, 3, 3.1, 7`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

test('[BR05-Code1-TC2] "upcoming"', () => {
  const expected = 'upcoming';
  const actual = rules.stageOf('confirmed', '2026-11-15', '2026-11-17', '2026-11-10');

  console.log(`\n  [BR05-Code1-TC2]`);
  console.log(`    Line number executed: 1-2, 3, 4, 4.1, 7`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

test('[BR05-Code1-TC3] "ongoing"', () => {
  const expected = 'ongoing';
  const actual = rules.stageOf('confirmed', '2026-11-08', '2026-11-12', '2026-11-10');

  console.log(`\n  [BR05-Code1-TC3]`);
  console.log(`    Line number executed: 1-2, 3, 4, 5, 5.1, 7`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

test('[BR05-Code1-TC4] "completed"', () => {
  const expected = 'completed';
  const actual = rules.stageOf('confirmed', '2026-11-05', '2026-11-08', '2026-11-10');

  console.log(`\n  [BR05-Code1-TC4]`);
  console.log(`    Line number executed: 1-2, 3, 4, 5, 6, 7`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

// =========================================================================
// ============================= ĐOẠN CODE 2 ===============================
// =========================================================================

const kit = loadWithFakes();
const { call, listingsRouter, Booking, Listing, User } = kit;
test.after(() => kit.restore());

const USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const LISTING_ID = '100';

test.beforeEach(async () => {
  await Booking.deleteMany({});
  await Listing.deleteMany({});
  await User.deleteMany({});

  const user = new User({
    _id: USER_ID,
    name: 'Test Reviewer',
    email: 'reviewer@test.com',
  });
  await user.save();

  const listing = new Listing({
    id: LISTING_ID,
    title: 'Test Listing',
    city: 'Hanoi',
    country: 'Vietnam',
    price: 50,
    maxGuests: 4,
    images: ['img.jpg'],
    reviewItems: [],
  });
  await listing.save();
});

const postReview = (body = { stars: 5, text: 'This is a great place to stay!' }) =>
  call(listingsRouter, 'POST', `/${LISTING_ID}/reviews`, {
    user: USER_ID,
    body,
  });

test('[BR05-Code2-TC1] Qua BR05, tao review', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await Booking.create({
      user: USER_ID,
      listingId: LISTING_ID,
      status: 'confirmed',
      checkIn: new Date('2026-11-01'),
      checkOut: new Date('2026-11-05'),
    });

    const res = await postReview();
    const passedBR05 = res.status === 201;
    const actual = passedBR05 ? 'Qua BR05, tao review' : `${res.status}, code ${res.body?.code}`;
    const expected = 'Qua BR05, tao review';

    console.log(`\n  [BR05-Code2-TC1]`);
    console.log(`    Line number executed: 1-2, 3, 10, 18, 19, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 201);
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

test('[BR05-Code2-TC2] 403, code NO_BOOKING', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const res = await postReview();
    const actual = `${res.status}, code ${res.body?.code}`;
    const expected = '403, code NO_BOOKING';

    console.log(`\n  [BR05-Code2-TC2]`);
    console.log(`    Line number executed: 1-2, 3, 4, 5, 6, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'NO_BOOKING');
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

test('[BR05-Code2-TC3] 403, code BOOKING_NOT_COMPLETED stage upcoming', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await Booking.create({
      user: USER_ID,
      listingId: LISTING_ID,
      status: 'confirmed',
      checkIn: new Date('2026-11-15T00:00:00.000Z'),
      checkOut: new Date('2026-11-17T00:00:00.000Z'),
    });

    const res = await postReview();
    const actual = `${res.status}, code ${res.body?.code} stage ${res.body?.stage}`;
    const expected = '403, code BOOKING_NOT_COMPLETED stage upcoming';

    console.log(`\n  [BR05-Code2-TC3]`);
    console.log(`    Line number executed: 1-2, 3, 4, 5, 7, 8, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'BOOKING_NOT_COMPLETED');
    assert.equal(res.body.stage, 'upcoming');
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

test('[BR05-Code2-TC4] Qua BR05, tao review', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const res = await postReview();
    const passedBR05 = res.status === 201;
    const actual = passedBR05 ? 'Qua BR05, tao review' : `${res.status}, code ${res.body?.code}`;
    const expected = 'Qua BR05, tao review';

    console.log(`\n  [BR05-Code2-TC4]`);
    console.log(`    Line number executed: 1-2, 3, 10, 11, 12, 18, 19, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 201);
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

test('[BR05-Code2-TC5] 403, code BOOKING_NOT_COMPLETED stage ongoing', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    await Booking.create({
      user: USER_ID,
      listingId: LISTING_ID,
      status: 'confirmed',
      checkIn: new Date('2026-11-08T00:00:00.000Z'),
      checkOut: new Date('2026-11-15T00:00:00.000Z'),
    });

    const res = await postReview();
    const actual = `${res.status}, code ${res.body?.code} stage ${res.body?.stage}`;
    const expected = '403, code BOOKING_NOT_COMPLETED stage ongoing';

    console.log(`\n  [BR05-Code2-TC5]`);
    console.log(`    Line number executed: 1-2, 3, 10, 11, 12, 13, 14, 15, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'BOOKING_NOT_COMPLETED');
    assert.equal(res.body.stage, 'ongoing');
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

test('[BR05-Code2-TC6] Qua BR05, tao review', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    await Booking.create({
      user: USER_ID,
      listingId: LISTING_ID,
      status: 'confirmed',
      checkIn: new Date('2026-11-01T00:00:00.000Z'),
      checkOut: new Date('2026-11-05T00:00:00.000Z'),
    });

    const res = await postReview();
    const passedBR05 = res.status === 201;
    const actual = passedBR05 ? 'Qua BR05, tao review' : `${res.status}, code ${res.body?.code}`;
    const expected = 'Qua BR05, tao review';

    console.log(`\n  [BR05-Code2-TC6]`);
    console.log(`    Line number executed: 1-2, 3, 10, 11, 12, 13, 14, 16, 18, 19, 20`);
    console.log(`    Expected result     : ${expected}`);
    console.log(`    Actual result       : ${actual}`);
    console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

    assert.equal(res.status, 201);
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});
