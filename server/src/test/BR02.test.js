/**
 * Unit Test cho BR02: Tổng giá = price_per_night × số đêm + tổng listing_fees
 * Backend tự tính lại, không tin giá từ client
 * 
 * Coverage:
 * - priceStay function: lines 87-92 trong bookingRules.js
 * - CFG: 1-2 → 3 → 4 → 5 → 6 → 7
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../services/bookingRules');

test('[BR02-TC1] Luồng tính toán - pricePerNight=100, nights=2', () => {
  // Line executed: 1-2, 3, 4, 5, 6, 7
  // Act
  const result = rules.priceStay(100, 2);
  
  // Assert
  // Line 3: const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  assert.equal(result.subtotal, 200, 'subtotal = 100 * 2 = 200');
  assert.equal(result.nightly, 100);
  assert.equal(result.nights, 2);
  
  // Line 4: const fees = FEES.map(...)
  // Line 5: const feesTotal = fees.reduce(...)
  // FEES = [{ Kayak: 5 }, { Parking: 5 }] → feesTotal = 10
  assert.equal(result.fees.length, 2);
  assert.equal(result.feesTotal, 10, 'feesTotal = Kayak(5) + Parking(5) = 10');
  
  // Line 6: total = Math.round((subtotal + feesTotal) * 100) / 100
  assert.equal(result.total, 210, 'total = 200 + 10 = 210');
});
