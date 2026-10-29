const test = require('node:test');
const assert = require('node:assert/strict');
const r = require('../src/services/bookingRules');

const D = (s) => r.parseDateOnly(s);
const listing = { maxGuests: 2, price: 20 };
const today = D('2026-10-29');

test('parseDateOnly chấp nhận ngày hợp lệ và từ chối ngày sai', () => {
  assert.equal(r.toDateOnly(D('2026-02-28')), '2026-02-28');
  assert.equal(D('2026-02-30'), null);
  assert.equal(D('2026-13-01'), null);
  assert.equal(D('29/10/2026'), null);
  assert.equal(D(20261029), null);
});

test('todayUTC tính theo múi giờ cấu hình (UTC+7 qua nửa đêm)', () => {
  const now = Date.UTC(2026, 9, 29, 18, 0, 0); // 18:00 UTC = 01:00 ngày 30 ở UTC+7
  assert.equal(r.toDateOnly(r.todayUTC(now, 420)), '2026-10-30');
  assert.equal(r.toDateOnly(r.todayUTC(now, 0)), '2026-10-29');
});

test('parseStay: hợp lệ', () => {
  const s = r.parseStay({ checkIn: '2026-11-10', checkOut: '2026-11-12', adults: 2, children: 0 }, listing, today);
  assert.equal(s.nights, 2);
  assert.equal(r.eachNight(s.checkIn, s.nights).map(r.toDateOnly).join(), '2026-11-10,2026-11-11');
});

test('parseStay: các lỗi', () => {
  const bad = (body, re) => assert.throws(() => r.parseStay(body, listing, today), (e) => e.status === 400 && re.test(e.message));
  bad({ checkIn: '2026-10-28', checkOut: '2026-10-30', adults: 1 }, /past/);
  bad({ checkIn: '2026-11-10', checkOut: '2026-11-10', adults: 1 }, /after/);
  bad({ checkIn: '2026-11-10', checkOut: '2026-12-20', adults: 1 }, /at most/);
  bad({ checkIn: '2028-01-10', checkOut: '2028-01-12', adults: 1 }, /in advance/);
  bad({ checkIn: '2026-11-10', checkOut: '2026-11-12', adults: 0, children: 2 }, /adult/);
  bad({ checkIn: '2026-11-10', checkOut: '2026-11-12', adults: 2, children: 1 }, /up to 2 guests/);
  bad({ checkIn: 'x', checkOut: 'y', adults: 1 }, /required/);
});

test('hôm nay được phép nhận phòng', () => {
  assert.doesNotThrow(() => r.parseStay({ checkIn: '2026-10-29', checkOut: '2026-10-30', adults: 1 }, listing, today));
});

test('priceStay và paymentOptions', () => {
  const p = r.priceStay(20, 3);
  assert.equal(p.subtotal, 60);
  assert.equal(p.feesTotal, 10);
  assert.equal(p.total, 70);
  const o = r.paymentOptions(71);
  assert.deepEqual(o.full, { payNow: 71, balanceDue: 0 });
  assert.equal(o.part.payNow + o.part.balanceDue, 71);
});

test('paymentFor', () => {
  const full = r.paymentFor('full', 70);
  assert.equal(full.status, 'paid'); assert.equal(full.amountPaid, 70); assert.equal(full.balanceDue, 0);
  const part = r.paymentFor('part', 70);
  assert.equal(part.status, 'partial'); assert.equal(part.amountPaid, 35); assert.equal(part.balanceDue, 35);
  assert.throws(() => r.paymentFor('cash', 70), (e) => e.status === 400);
});

test('cancellationInfo theo số ngày còn lại', () => {
  const at = (checkIn, status = 'confirmed') => r.cancellationInfo({ status, checkIn: D(checkIn), amountPaid: 70 }, today);
  assert.deepEqual(at('2026-11-05'), { allowed: true, refundPercent: 100, refundAmount: 70 }); // 7 ngày
  assert.deepEqual(at('2026-11-04'), { allowed: true, refundPercent: 50, refundAmount: 35 });  // 6 ngày
  assert.deepEqual(at('2026-10-31'), { allowed: true, refundPercent: 50, refundAmount: 35 });  // 2 ngày
  assert.deepEqual(at('2026-10-30'), { allowed: true, refundPercent: 0, refundAmount: 0 });    // 1 ngày
  assert.equal(at('2026-10-29').allowed, false);                                               // ngày nhận phòng
  assert.equal(at('2026-10-20').allowed, false);
  assert.equal(at('2026-11-20', 'cancelled').allowed, false);
});

test('stageOf', () => {
  const st = (a, b, s = 'confirmed') => r.stageOf(s, D(a), D(b), today);
  assert.equal(st('2026-11-01', '2026-11-03'), 'upcoming');
  assert.equal(st('2026-10-28', '2026-10-30'), 'ongoing');
  assert.equal(st('2026-10-27', '2026-10-29'), 'completed');
  assert.equal(st('2026-11-01', '2026-11-03', 'cancelled'), 'cancelled');
});

test('generateRef và normalizeKey', () => {
  assert.match(r.generateRef(), /^TRV-[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(r.normalizeKey('abc'), null);
  assert.equal(r.normalizeKey('k3x9-abc_DEF1'), 'k3x9-abc_DEF1');
  assert.equal(r.normalizeKey('bad key!!!!'), null);
});

test('isDuplicateKey', () => {
  assert.equal(r.isDuplicateKey({ code: 11000 }), true);
  assert.equal(r.isDuplicateKey({ writeErrors: [{ code: 11000 }] }), true);
  assert.equal(r.isDuplicateKey(new Error('boom')), false);
});
