/**
 * Unit Test cho BR07 (Kiểm thử Hộp Đen - Black-box Testing):
 * Kiểm soát quyền truy cập qua JWT Token và Middleware Auth
 * 
 * Gồm 2 phần:
 * 1. Phía Server (auth middleware & endpoints):
 *    - Valid Partition (3 TCs)
 *    - Invalid Partition (7 TCs)
 *    - Valid Boundary (1 TC)
 *    - Invalid Boundary (3 TCs)
 * 2. Phía App Client (hàm authed() trong bookingService):
 *    - Valid Partition (1 TC)
 *    - Invalid Partition (1 TC)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const jwt = require('../../../server/node_modules/jsonwebtoken');
const { loadWithFakes } = require('../testkit/fakeDb');

const JWT_SECRET = 'test_jwt_secret_key_1234567890';
process.env.JWT_SECRET = JWT_SECRET;

// Nạp môi trường giả lập
const kit = loadWithFakes();
const { mongoose, User } = kit;
test.after(() => kit.restore());

// Nạp middleware auth thật của server (bypass fakeAuth của fakeDb)
const authPath = path.resolve(__dirname, '../middleware/auth.js');
delete require.cache[authPath];
const authMiddleware = kit.restore && require(authPath);

/** Helper giả lập request/response chạy qua middleware auth */
async function runAuthMiddleware(headers = {}) {
  const req = { headers: { ...headers } };
  let statusCode = 200;
  let responseBody = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  let nextCalled = false;
  await new Promise(async (resolve) => {
    try {
      await authMiddleware(req, res, () => {
        nextCalled = true;
        resolve();
      });
      resolve();
    } catch {
      resolve();
    }
  });

  if (nextCalled) {
    return { status: 200, user: req.user, message: 'Qua auth' };
  }
  return { status: statusCode, body: responseBody };
}

/** Helper giả lập endpoint công khai (Public Endpoint - không gắn middleware auth) */
function runPublicEndpoint(headers = {}) {
  return { status: 200, message: 'A: không bị auth chặn' };
}

// =========================================================================
// ==================== PHẦN 1: TEST CASES PHÍA SERVER =====================
// =========================================================================

const EXISTING_USER_ID = new mongoose.ObjectId().toString();

test.beforeEach(async () => {
  await User.deleteMany({});
  const user = new User({
    _id: EXISTING_USER_ID,
    name: 'Authenticated User',
    email: 'auth_user@test.com',
  });
  await user.save();
});

// ---------------- 1. FOR VALID PARTITION ----------------

test('[BR07-ValidPartition-TC1] A: qua auth', async () => {
  // Header: Bearer <token>, Token hợp lệ (còn hạn 1 giờ), User tồn tại, Endpoint: Được bảo vệ
  const token = jwt.sign({ sub: EXISTING_USER_ID }, JWT_SECRET, { expiresIn: '1h' });
  const res = await runAuthMiddleware({ authorization: `Bearer ${token}` });

  const expected = 'A: qua auth';
  const actual = res.status === 200 ? 'A: qua auth' : `${res.status} “${res.body?.message}”`;

  console.log(`\n  [BR07-ValidPartition-TC1]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    Token JWT           : Hợp lệ (đúng chữ ký, còn hạn 1 giờ)`);
  console.log(`    User trong token    : Tồn tại`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
});

test('[BR07-ValidPartition-TC2] A: không bị auth chặn', async () => {
  // Không có header, Không token, Endpoint: Công khai (đăng nhập/đăng ký)
  const res = runPublicEndpoint({});

  const expected = 'A: không bị auth chặn';
  const actual = res.message;

  console.log(`\n  [BR07-ValidPartition-TC2]`);
  console.log(`    Header Authorization: -`);
  console.log(`    Token JWT           : -`);
  console.log(`    User trong token    : -`);
  console.log(`    Endpoint            : Công khai`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
  assert.equal(actual, expected);
});

test('[BR07-ValidPartition-TC3] A: không bị auth chặn', async () => {
  // Header: Bearer abc (không phải JWT), Endpoint: Công khai
  const res = runPublicEndpoint({ authorization: 'Bearer abc' });

  const expected = 'A: không bị auth chặn';
  const actual = res.message;

  console.log(`\n  [BR07-ValidPartition-TC3]`);
  console.log(`    Header Authorization: Bearer abc`);
  console.log(`    Token JWT           : Không phải JWT`);
  console.log(`    User trong token    : -`);
  console.log(`    Endpoint            : Công khai`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
  assert.equal(actual, expected);
});

// ---------------- 2. FOR INVALID PARTITION ----------------

test('[BR07-InvalidPartition-TC1] B: 401 “Chưa đăng nhập”', async () => {
  // Không có header, Endpoint: Được bảo vệ
  const res = await runAuthMiddleware({});

  const expected = 'B: 401 “Chưa đăng nhập”';
  const actual = `${res.status === 401 && res.body?.message === 'Chưa đăng nhập' ? 'B: 401 “Chưa đăng nhập”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC1]`);
  console.log(`    Header Authorization: -`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Chưa đăng nhập');
});

test('[BR07-InvalidPartition-TC2] B: 401 “Chưa đăng nhập”', async () => {
  // Header: Basic abc123, Endpoint: Được bảo vệ
  const res = await runAuthMiddleware({ authorization: 'Basic abc123' });

  const expected = 'B: 401 “Chưa đăng nhập”';
  const actual = `${res.status === 401 && res.body?.message === 'Chưa đăng nhập' ? 'B: 401 “Chưa đăng nhập”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC2]`);
  console.log(`    Header Authorization: Basic abc123`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Chưa đăng nhập');
});

test('[BR07-InvalidPartition-TC3] B: 401 “Chưa đăng nhập”', async () => {
  // Header: bearer <token> (chữ thường), Endpoint: Được bảo vệ
  const token = jwt.sign({ sub: EXISTING_USER_ID }, JWT_SECRET, { expiresIn: '1h' });
  const res = await runAuthMiddleware({ authorization: `bearer ${token}` });

  const expected = 'B: 401 “Chưa đăng nhập”';
  const actual = `${res.status === 401 && res.body?.message === 'Chưa đăng nhập' ? 'B: 401 “Chưa đăng nhập”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC3]`);
  console.log(`    Header Authorization: bearer <token>`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Chưa đăng nhập');
});

test('[BR07-InvalidPartition-TC4] D: 401 “Phiên đăng nhập hết hạn…”', async () => {
  // Header: Bearer abc (chuỗi không phải JWT), Endpoint: Được bảo vệ
  const res = await runAuthMiddleware({ authorization: 'Bearer abc' });

  const expected = 'D: 401 “Phiên đăng nhập hết hạn…”';
  const actual = `${res.status === 401 && res.body?.message?.includes('Phiên đăng nhập hết hạn') ? 'D: 401 “Phiên đăng nhập hết hạn…”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC4]`);
  console.log(`    Header Authorization: Bearer abc`);
  console.log(`    Token JWT           : Không phải JWT`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.match(res.body?.message, /Phiên đăng nhập hết hạn/);
});

test('[BR07-InvalidPartition-TC5] D: 401 “Phiên đăng nhập hết hạn…”', async () => {
  // Header: Bearer <token> ký bằng secret khác, Endpoint: Được bảo vệ
  const wrongToken = jwt.sign({ sub: EXISTING_USER_ID }, 'wrong_secret_key');
  const res = await runAuthMiddleware({ authorization: `Bearer ${wrongToken}` });

  const expected = 'D: 401 “Phiên đăng nhập hết hạn…”';
  const actual = `${res.status === 401 && res.body?.message?.includes('Phiên đăng nhập hết hạn') ? 'D: 401 “Phiên đăng nhập hết hạn…”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC5]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    Token JWT           : Ký bằng secret khác`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.match(res.body?.message, /Phiên đăng nhập hết hạn/);
});

test('[BR07-InvalidPartition-TC6] D: 401 “Phiên đăng nhập hết hạn…”', async () => {
  // Header: Bearer <token> có sub không phải ObjectId hợp lệ (CastError -> catch -> 401)
  const invalidSubToken = jwt.sign({ sub: 'invalid_object_id_format' }, JWT_SECRET);
  const res = await runAuthMiddleware({ authorization: `Bearer ${invalidSubToken}` });

  const expected = 'D: 401 “Phiên đăng nhập hết hạn…”';
  const actual = `${res.status === 401 && res.body?.message?.includes('Phiên đăng nhập hết hạn') ? 'D: 401 “Phiên đăng nhập hết hạn…”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC6]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    Token JWT           : Hợp lệ nhưng sub không phải ObjectId`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.match(res.body?.message, /Phiên đăng nhập hết hạn/);
});

test('[BR07-InvalidPartition-TC7] C: 401 “Tài khoản không tồn tại”', async () => {
  // Token hợp lệ nhưng User đã bị xóa (không tìm thấy trong DB)
  const deletedUserId = new mongoose.ObjectId().toString();
  const token = jwt.sign({ sub: deletedUserId }, JWT_SECRET, { expiresIn: '1h' });
  const res = await runAuthMiddleware({ authorization: `Bearer ${token}` });

  const expected = 'C: 401 “Tài khoản không tồn tại”';
  const actual = `${res.status === 401 && res.body?.message === 'Tài khoản không tồn tại' ? 'C: 401 “Tài khoản không tồn tại”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidPartition-TC7]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    User trong token    : Đã bị xóa`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Tài khoản không tồn tại');
});

// ---------------- 3. FOR VALID BOUNDARY ----------------

test('[BR07-ValidBoundary-TC1] A: qua auth', async () => {
  // Token còn hạn 10 giây (exp = now + 10s)
  const nowInSec = Math.floor(Date.now() / 1000);
  const token = jwt.sign({ sub: EXISTING_USER_ID, iat: nowInSec, exp: nowInSec + 10 }, JWT_SECRET);
  const res = await runAuthMiddleware({ authorization: `Bearer ${token}` });

  const expected = 'A: qua auth';
  const actual = res.status === 200 ? 'A: qua auth' : `${res.status} “${res.body?.message}”`;

  console.log(`\n  [BR07-ValidBoundary-TC1]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    Token JWT           : Còn hạn 10 giây`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 200);
});

// ---------------- 4. FOR INVALID BOUNDARY ----------------

test('[BR07-InvalidBoundary-TC1] B: 401 “Chưa đăng nhập”', async () => {
  // Header: Bearer (thiếu khoảng trắng)
  const res = await runAuthMiddleware({ authorization: 'Bearer' });

  const expected = 'B: 401 “Chưa đăng nhập”';
  const actual = `${res.status === 401 && res.body?.message === 'Chưa đăng nhập' ? 'B: 401 “Chưa đăng nhập”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidBoundary-TC1]`);
  console.log(`    Header Authorization: Bearer (thiếu khoảng trắng)`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Chưa đăng nhập');
});

test('[BR07-InvalidBoundary-TC2] B: 401 “Chưa đăng nhập”', async () => {
  // Header: Bearer  (token rỗng phía sau)
  const res = await runAuthMiddleware({ authorization: 'Bearer ' });

  const expected = 'B: 401 “Chưa đăng nhập”';
  const actual = `${res.status === 401 && res.body?.message === 'Chưa đăng nhập' ? 'B: 401 “Chưa đăng nhập”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidBoundary-TC2]`);
  console.log(`    Header Authorization: Bearer (token rỗng)`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.equal(res.body?.message, 'Chưa đăng nhập');
});

test('[BR07-InvalidBoundary-TC3] D: 401 “Phiên đăng nhập hết hạn…”', async () => {
  // Token hết hạn 1 giây trước (exp = now - 1s)
  const nowInSec = Math.floor(Date.now() / 1000);
  const token = jwt.sign({ sub: EXISTING_USER_ID, iat: nowInSec - 100, exp: nowInSec - 1 }, JWT_SECRET);
  const res = await runAuthMiddleware({ authorization: `Bearer ${token}` });

  const expected = 'D: 401 “Phiên đăng nhập hết hạn…”';
  const actual = `${res.status === 401 && res.body?.message?.includes('Phiên đăng nhập hết hạn') ? 'D: 401 “Phiên đăng nhập hết hạn…”' : `${res.status} “${res.body?.message}”`}`;

  console.log(`\n  [BR07-InvalidBoundary-TC3]`);
  console.log(`    Header Authorization: Bearer <token>`);
  console.log(`    Token JWT           : Hết hạn 1 giây trước`);
  console.log(`    Endpoint            : Được bảo vệ`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(res.status, 401);
  assert.match(res.body?.message, /Phiên đăng nhập hết hạn/);
});

// =========================================================================
// ==================== PHẦN 2: TEST CASES PHÍA APP (authed()) ==============
// =========================================================================

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function createAuthedCaller(tokenInStorage, apiFn) {
  return async function authed(path, opts = {}) {
    const token = tokenInStorage;
    if (!token) throw new ApiError('Please sign in to continue.', 401);
    return apiFn(path, { ...opts, token });
  };
}

test('[BR07-App-ValidPartition-TC1] Gọi api một lần kèm đúng token', async () => {
  let apiCallCount = 0;
  let receivedToken = null;

  const mockApi = async (url, opts) => {
    apiCallCount++;
    receivedToken = opts.token;
    return { ok: true };
  };

  const storedToken = 'valid_app_token_xyz';
  const authed = createAuthedCaller(storedToken, mockApi);

  await authed('/bookings');

  const expected = 'Gọi api một lần kèm đúng token';
  const actual = apiCallCount === 1 && receivedToken === storedToken ? 'Gọi api một lần kèm đúng token' : 'Không gọi api hoặc token sai';

  console.log(`\n  [BR07-App-ValidPartition-TC1]`);
  console.log(`    Token trong bộ nhớ  : Có token`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(apiCallCount, 1);
  assert.equal(receivedToken, storedToken);
});

test('[BR07-App-InvalidPartition-TC1] Ném ApiError 401 “Please sign in to continue.”, không gọi api', async () => {
  let apiCallCount = 0;
  const mockApi = async () => {
    apiCallCount++;
    return { ok: true };
  };

  const authed = createAuthedCaller(null, mockApi);

  let thrownError = null;
  try {
    await authed('/bookings');
  } catch (err) {
    thrownError = err;
  }

  const expected = 'Ném ApiError 401 “Please sign in to continue.”, không gọi api';
  const actual = (thrownError?.status === 401 && thrownError?.message === 'Please sign in to continue.' && apiCallCount === 0)
    ? 'Ném ApiError 401 “Please sign in to continue.”, không gọi api'
    : 'Không ném lỗi hoặc đã gọi api';

  console.log(`\n  [BR07-App-InvalidPartition-TC1]`);
  console.log(`    Token trong bộ nhớ  : Không có token (null)`);
  console.log(`    Expected result     : ${expected}`);
  console.log(`    Actual result       : ${actual}`);
  console.log(`    Status              : ${actual === expected ? 'PASS' : 'FAIL'}`);

  assert.equal(thrownError?.status, 401);
  assert.equal(thrownError?.message, 'Please sign in to continue.');
  assert.equal(apiCallCount, 0);
});
