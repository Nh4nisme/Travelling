/**
 * Unit Test cho BR03: Validation số lượng khách
 * adults + children ≤ max_guests; adults ≥ 1
 * 
 * Coverage:
 * - parseStay function: lines 77-83 trong bookingRules.js
 * - CFG nodes: 1, 2, 2.1, 2.2, 2.3, 3, 3.1, 4, 4.1, 5, 6, 7
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../services/bookingRules');

const listing = { maxGuests: 4, price: 20 };
const today = rules.parseDateOnly('2026-11-10');

// ============ BẢO PHÚ NHÁNH parseStay - validation guests ============

test('[BR03-TC1] children không gửi - if (adults < 1) FALSE, if (children === null) TRUE, children = 0', () => {
  // Line executed: 1, 2, 2.1, 2.2, 2.3, 3, 4, 5, 7
  // Act: children = undefined
  const result = rules.parseStay({
    checkIn: '2026-11-20',
    checkOut: '2026-11-22',
    adults: 2,
    children: undefined,
  }, listing, today);
  
  // Assert: children được set = 0 (line 78)
  assert.equal(result.adults, 2);
  assert.equal(result.children, 0);
  assert.equal(result.nights, 2);
});

test('[BR03-TC2] children có gửi - if (adults < 1) FALSE, if (children === null) FALSE, if (adults + children > maxGuests) FALSE', () => {
  // Line executed: 1, 2, 2.1, 2.3, 3, 4, 5, 7
  // Act: children = 1
  const result = rules.parseStay({
    checkIn: '2026-11-20',
    checkOut: '2026-11-22',
    adults: 2,
    children: 1,
  }, listing, today);
  
  // Assert
  assert.equal(result.adults, 2);
  assert.equal(result.children, 1);
});

test('[BR03-TC3] children không gửi, adults < 1 - throw httpError "At least 1 adult is required."', () => {
  // Line executed: 1, 2, 2.1, 2.2, 3, 3.1
  // Act & Assert: adults = 0 → throw error (line 79)
  assert.throws(
    () => rules.parseStay({
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      adults: 0,
      children: undefined,
    }, listing, today),
    (err) => err.status === 400 && /at least 1 adult/i.test(err.message)
  );
});

test('[BR03-TC4] children không hợp lệ - throw httpError "Number of children is invalid."', () => {
  // Line executed: 1, 2, 2.1, 2.3, 3, 4, 4.1
  // Act & Assert: children = "abc" (invalid) → throw error (line 80)
  assert.throws(
    () => rules.parseStay({
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      adults: 2,
      children: 'abc',
    }, listing, today),
    (err) => err.status === 400 && /number of children is invalid/i.test(err.message)
  );
});

test('[BR03-TC5] children có gửi, adults + children > maxGuests - throw httpError "This place accepts up to 4 guests."', () => {
  // Line executed: 1, 2, 2.1, 2.3, 3, 4, 5, 6
  // Act & Assert: adults=3, children=2 (total=5 > maxGuests=4) → throw error (line 81-82)
  assert.throws(
    () => rules.parseStay({
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      adults: 3,
      children: 2,
    }, listing, today),
    (err) => err.status === 400 && /accepts up to 4 guests/i.test(err.message)
  );
});

// ============ INTEGRATION TEST - Full booking flow ============

test('[BR03-Integration] Full booking flow với validation guests', async () => {
  const { loadWithFakes } = require('../testkit/fakeDb');
  const kit = loadWithFakes();
  const { call, bookingsRouter, Listing, User } = kit;
  
  try {
    const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const user = new User({ 
      _id: userId, 
      name: 'Test', 
      email: 'test@test.com', 
      paymentPinSet: true, 
      paymentPin: 'hashed' 
    });
    user.comparePaymentPin = async () => true;
    await user.save();
    
    if (!(await Listing.findOne({ id: '1' }))) {
      await new Listing({
        id: '1', title: 'Test', city: 'City', country: 'Country',
        price: 100, maxGuests: 4, images: ['img.jpg'],
        checkInTime: '14:00', checkOutTime: '12:00',
      }).save();
    }
    
    const iso = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };
    
    // Test 1: Valid - adults=2, children=1 (total=3 ≤ 4)
    const r1 = await call(bookingsRouter, 'POST', '/', {
      user: userId,
      body: {
        listingId: '1',
        checkIn: iso(10),
        checkOut: iso(12),
        adults: 2,
        children: 1,
        paymentMethod: 'full',
        paymentPin: '123456',
      }
    });
    assert.equal(r1.status, 201);
    assert.equal(r1.body.booking.adults, 2);
    assert.equal(r1.body.booking.children, 1);
    
    // Test 2: Invalid - adults=0
    const r2 = await call(bookingsRouter, 'POST', '/', {
      user: userId,
      body: {
        listingId: '1',
        checkIn: iso(20),
        checkOut: iso(22),
        adults: 0,
        children: 2,
        paymentMethod: 'full',
        paymentPin: '123456',
      }
    });
    assert.equal(r2.status, 400);
    assert.match(r2.body.message, /at least 1 adult/i);
    
    // Test 3: Invalid - total guests > maxGuests
    const r3 = await call(bookingsRouter, 'POST', '/', {
      user: userId,
      body: {
        listingId: '1',
        checkIn: iso(30),
        checkOut: iso(32),
        adults: 3,
        children: 2, // total = 5 > maxGuests = 4
        paymentMethod: 'full',
        paymentPin: '123456',
      }
    });
    assert.equal(r3.status, 400);
    assert.match(r3.body.message, /accepts up to 4 guests/i);
    
  } finally {
    kit.restore();
  }
});
