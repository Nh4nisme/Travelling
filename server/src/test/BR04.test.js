/**
 * Unit Test cho BR04: Booking chuyển CONFIRMED khi paid amount >= mức tối thiểu của hình thức thanh toán
 * 
 * Coverage:
 * - Code 1: getMinimumPayment function (lines 120-123 trong bookingRules.js)
 * - Code 2: determineBookingStatus function (lines 125-129 trong bookingRules.js)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../services/bookingRules');

// ============ ĐOẠN CODE 1: getMinimumPayment (DEPOSIT_RATE = 0.5) ============

test('[BR04-Code1-TC1] 250', () => {
  const expected = 250;
  const actual = rules.getMinimumPayment('full', 250);

  console.log(`\n  [BR04-Code1-TC1]`);
  console.log(`    Line number executed: 1-2, 3, 3.1, 4`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

test('[BR04-Code1-TC2] 125', () => {
  const expected = 125;
  const actual = rules.getMinimumPayment('part', 250);

  console.log(`\n  [BR04-Code1-TC2]`);
  console.log(`    Line number executed: 1-2, 3, 3.2, 4`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

// ============ ĐOẠN CODE 2: determineBookingStatus (totalPrice = 250) ============

test('[BR04-Code2-TC1] "confirmed"', () => {
  const payment = { method: 'full', amountPaid: 250 };
  const totalPrice = 250;
  const expected = 'confirmed';
  const actual = rules.determineBookingStatus(payment, totalPrice);

  console.log(`\n  [BR04-Code2-TC1]`);
  console.log(`    Line number executed: 1-2, 3, 4, 4.1, 5`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});

test('[BR04-Code2-TC2] "pending"', () => {
  const payment = { method: 'full', amountPaid: 249 };
  const totalPrice = 250;
  const expected = 'pending';
  const actual = rules.determineBookingStatus(payment, totalPrice);

  console.log(`\n  [BR04-Code2-TC2]`);
  console.log(`    Line number executed: 1-2, 3, 4, 4.2, 5`);
  console.log(`    Expected result     : '${expected}'`);
  console.log(`    Actual result       : '${actual}'`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(actual, expected);
});
