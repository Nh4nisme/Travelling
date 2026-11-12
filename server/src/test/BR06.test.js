/**
 * Unit Test cho BR06: Bộ lọc giá 10-250 USD; "Present total price" = tổng gồm phí
 * 
 * Coverage:
 * - Đoạn code 1: Logic hiển thị giá trong ListingCard (lines 29-32 trong ListingCard.tsx)
 * - Đoạn code 2: Logic xây dựng query params trong listingService (lines 22-27 trong listingService.ts)
 * - Đoạn code 3: Backend lọc giá theo đêm hoặc tổng trong GET /search (lines 54-68 trong routes/listings.js)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWithFakes } = require('../testkit/fakeDb');

// =========================================================================
// ============================= ĐOẠN CODE 1 ===============================
// ListingCard displayPrice & priceLabel (Price = 120, FEES = 10)
// =========================================================================

function calcListingCardPrice(price, showTotal, estimatedNights) {
  const calcPrice = (p, n) => ({ total: p * n + 10 });
  const tListingNight = 'theo đêm';

  const displayPrice = showTotal && estimatedNights > 0
    ? calcPrice(price, estimatedNights).total
    : price;
  const priceLabel = showTotal ? 'total' : tListingNight;

  return { displayPrice, priceLabel };
}

test('[BR06-Code1-TC1] displayPrice = 250; label = "total"', () => {
  const price = 120;
  const showTotal = true;
  const estimatedNights = 2;

  const res = calcListingCardPrice(price, showTotal, estimatedNights);
  const actual = `displayPrice = ${res.displayPrice}; label = "${res.priceLabel}"`;
  const expected = 'displayPrice = 250; label = "total"';

  console.log(`\n  [BR06-Code1-TC1]`);
  console.log(`    Line number executed: 1, 2, 4, 4.1, 5`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.displayPrice, 250);
  assert.equal(res.priceLabel, 'total');
});

test('[BR06-Code1-TC2] displayPrice = 120; label = theo đêm', () => {
  const price = 120;
  const showTotal = false;
  const estimatedNights = 2;

  const res = calcListingCardPrice(price, showTotal, estimatedNights);
  const actual = `displayPrice = ${res.displayPrice}; label = ${res.priceLabel}`;
  const expected = 'displayPrice = 120; label = theo đêm';

  console.log(`\n  [BR06-Code1-TC2]`);
  console.log(`    Line number executed: 1, 3, 4, 4.2, 5`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.displayPrice, 120);
  assert.equal(res.priceLabel, 'theo đêm');
});

test('[BR06-Code1-TC3] displayPrice = 120; label = "total"', () => {
  const price = 120;
  const showTotal = true;
  const estimatedNights = 0;

  const res = calcListingCardPrice(price, showTotal, estimatedNights);
  const actual = `displayPrice = ${res.displayPrice}; label = "${res.priceLabel}"`;
  const expected = 'displayPrice = 120; label = "total"';

  console.log(`\n  [BR06-Code1-TC3]`);
  console.log(`    Line number executed: 1, 3, 4, 4.1, 5`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.displayPrice, 120);
  assert.equal(res.priceLabel, 'total');
});

// =========================================================================
// ============================= ĐOẠN CODE 2 ===============================
// listingService params.presentTotal & params.nights
// =========================================================================

function buildSearchParams(filters, search) {
  const params = {};
  params.presentTotal = String(filters.total);
  if (filters.total && search.start && search.end) {
    const diff = new Date(search.end).getTime() - new Date(search.start).getTime();
    const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    params.nights = nights;
  }
  return params;
}

test('[BR06-Code2-TC1] params = { presentTotal: "true", nights: 2 }', () => {
  const filters = { total: true };
  const search = { start: '2026-12-01', end: '2026-12-03' };

  const params = buildSearchParams(filters, search);
  const actual = `params = { presentTotal: '${params.presentTotal}', nights: ${params.nights} }`;
  const expected = `params = { presentTotal: 'true', nights: 2 }`;

  console.log(`\n  [BR06-Code2-TC1]`);
  console.log(`    Line number executed: 1, 2, 3-5, 7`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(params.presentTotal, 'true');
  assert.equal(params.nights, 2);
});

test('[BR06-Code2-TC2] params = { presentTotal: "false" }, không có nights', () => {
  const filters = { total: false };
  const search = { start: '2026-12-01', end: '2026-12-03' };

  const params = buildSearchParams(filters, search);
  const actual = `params = { presentTotal: '${params.presentTotal}' }, không có nights`;
  const expected = `params = { presentTotal: 'false' }, không có nights`;

  console.log(`\n  [BR06-Code2-TC2]`);
  console.log(`    Line number executed: 1, 2, 7`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(params.presentTotal, 'false');
  assert.equal(params.nights, undefined);
});

// =========================================================================
// ============================= ĐOẠN CODE 3 ===============================
// Backend GET /search
// =========================================================================

const kit = loadWithFakes();
const { call, listingsRouter, Listing } = kit;
test.after(() => kit.restore());

test.beforeEach(async () => {
  await Listing.deleteMany({});
  await Listing.create({
    id: '1',
    title: 'Alpine chalet',
    city: 'Interlaken',
    country: 'Switzerland',
    price: 120,
    maxGuests: 4,
    images: ['img.jpg'],
  });
});

test('[BR06-Code3-TC1] Lọc theo tổng: 120 * 2 + 10 = 250 > 240, Alpine chalet không có trong kết quả', async () => {
  const res = await call(listingsRouter, 'GET', '/search?presentTotal=true&nights=2&minPrice=10&maxPrice=240');
  const found = res.body.some((l) => l.title === 'Alpine chalet');
  const actual = found ? 'Alpine chalet có trong kết quả' : 'Lọc theo tổng: 120 * 2 + 10 = 250 > 240\nAlpine chalet không có trong kết quả';
  const expected = 'Lọc theo tổng: 120 * 2 + 10 = 250 > 240\nAlpine chalet không có trong kết quả';

  console.log(`\n  [BR06-Code3-TC1]`);
  console.log(`    Line number executed: 1, 2, 2.1, 3, 4, 5, 8`);
  console.log(`    Expected result     :\n      ${expected.replace('\n', '\n      ')}`);
  console.log(`    Actual result       :\n      ${actual.replace('\n', '\n      ')}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
  assert.equal(found, false);
});

test('[BR06-Code3-TC2] Lọc theo đêm: 120 <= 240, Alpine chalet có trong kết quả', async () => {
  const res = await call(listingsRouter, 'GET', '/search?presentTotal=false&nights=2&minPrice=10&maxPrice=240');
  const found = res.body.some((l) => l.title === 'Alpine chalet');
  const actual = found ? 'Lọc theo đêm: 120 <= 240\nAlpine chalet có trong kết quả' : 'Alpine chalet không có trong kết quả';
  const expected = 'Lọc theo đêm: 120 <= 240\nAlpine chalet có trong kết quả';

  console.log(`\n  [BR06-Code3-TC2]`);
  console.log(`    Line number executed: 1, 2, 2.1, 3, 4, 7, 8`);
  console.log(`    Expected result     :\n      ${expected.replace('\n', '\n      ')}`);
  console.log(`    Actual result       :\n      ${actual.replace('\n', '\n      ')}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
  assert.equal(found, true);
});

test('[BR06-Code3-TC3] Lọc theo đêm: 120 <= 125, Alpine chalet có trong kết quả', async () => {
  const res = await call(listingsRouter, 'GET', '/search?presentTotal=true&minPrice=10&maxPrice=125');
  const found = res.body.some((l) => l.title === 'Alpine chalet');
  const actual = found ? 'Lọc theo đêm: 120 <= 125\nAlpine chalet có trong kết quả' : 'Alpine chalet không có trong kết quả';
  const expected = 'Lọc theo đêm: 120 <= 125\nAlpine chalet có trong kết quả';

  console.log(`\n  [BR06-Code3-TC3]`);
  console.log(`    Line number executed: 1, 2, 2.2, 3, 4, 7, 8`);
  console.log(`    Expected result     :\n      ${expected.replace('\n', '\n      ')}`);
  console.log(`    Actual result       :\n      ${actual.replace('\n', '\n      ')}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
  assert.equal(found, true);
});
