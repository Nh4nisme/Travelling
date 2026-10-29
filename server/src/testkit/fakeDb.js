/**
 * Bộ giả lập tối giản của `express` và `mongoose` (lưu trong bộ nhớ) CHỈ để kiểm thử logic route booking
 * mà không cần MongoDB. Giả lập hành vi quan trọng nhất: index UNIQUE ném lỗi E11000, insertMany ordered
 * dừng ở lỗi đầu tiên (các bản ghi đã chèn vẫn còn, giống MongoDB thật).
 * Không thay thế được việc thử với MongoDB Atlas thật.
 */
const Module = require('module');
const path = require('path');
const crypto = require('crypto');

class ObjectId {
  constructor(v) { this.v = v || crypto.randomBytes(12).toString('hex'); }
  toString() { return this.v; }
}

const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const setPath = (o, p, val) => {
  const ks = p.split('.');
  let t = o;
  ks.slice(0, -1).forEach((k) => { if (t[k] == null) t[k] = {}; t = t[k]; });
  t[ks[ks.length - 1]] = val;
};
const same = (a, b) => (a instanceof Date && b instanceof Date ? +a === +b : String(a) === String(b));

function matches(doc, filter) {
  return Object.entries(filter).every(([k, v]) => {
    const val = getPath(doc, k);
    if (v && typeof v === 'object' && !(v instanceof Date) && !(v instanceof ObjectId)) {
      if ('$gte' in v && !(val >= v.$gte)) return false;
      if ('$lt' in v && !(val < v.$lt)) return false;
      if ('$lte' in v && !(val <= v.$lte)) return false;
      return true;
    }
    return val !== undefined && same(val, v);
  });
}

class Query {
  constructor(exec) { this.exec = exec; this.leaned = false; this.sortSpec = null; this.limitN = null; }
  lean() { this.leaned = true; return this; }
  select() { return this; }
  sort(s) { this.sortSpec = s; return this; }
  limit(n) { this.limitN = n; return this; }
  run() {
    let r = this.exec();
    if (Array.isArray(r)) {
      r = [...r];
      if (this.sortSpec) {
        const [[k, dir]] = Object.entries(this.sortSpec);
        r.sort((a, b) => (getPath(a, k) > getPath(b, k) ? 1 : getPath(a, k) < getPath(b, k) ? -1 : 0) * dir);
      }
      if (this.limitN) r = r.slice(0, this.limitN);
      return this.leaned ? r.map((d) => ({ ...d })) : r;
    }
    return this.leaned && r ? { ...r } : r;
  }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }
}

function createMongoose() {
  const collections = {};
  class Schema {
    constructor(def, opts) { this.def = def; this.opts = opts; this.methods = {}; this.indexes = []; }
    index(spec, opts) { this.indexes.push({ spec, opts }); }
  }
  Schema.Types = { ObjectId: 'ObjectId' };

  const dup = (keys) => Object.assign(new Error(`E11000 duplicate key error { ${keys.join(', ')} }`), {
    code: 11000, keyPattern: Object.fromEntries(keys.map((k) => [k, 1])),
  });

  function model(name, schema) {
    const docs = (collections[name] = []);
    const uniques = [
      ...Object.entries(schema.def).filter(([, d]) => d && d.unique).map(([k]) => [k]),
      ...schema.indexes.filter((i) => i.opts && i.opts.unique).map((i) => Object.keys(i.spec)),
    ];
    const checkUnique = (doc) => {
      for (const keys of uniques) {
        if (keys.includes('idempotencyKey') && typeof doc.idempotencyKey !== 'string') continue; // partial index
        const clash = docs.find((d) => d !== doc && keys.every((k) => getPath(d, k) !== undefined && same(getPath(d, k), getPath(doc, k))));
        if (clash) throw dup(keys);
      }
    };

    class Model {
      constructor(doc) {
        Object.assign(this, doc);
        if (!this._id) this._id = new ObjectId();
        this.__new = true;
      }
      async save() {
        if (this.__new) {
          checkUnique(this);
          this.createdAt = new Date();
          docs.push(this);
          this.__new = false;
        }
        return this;
      }
      static init() { return Promise.resolve(); }
      static findOne(f) { return new Query(() => docs.find((d) => matches(d, f)) || null); }
      static findById(id) { return new Query(() => docs.find((d) => same(d._id, id)) || null); }
      static find(f = {}) { return new Query(() => docs.filter((d) => matches(d, f))); }
      static exists(f) { return new Query(() => { const d = docs.find((x) => matches(x, f)); return d ? { _id: d._id } : null; }); }
      static async insertMany(arr) {
        for (const item of arr) {
          const d = new Model(item);
          checkUnique(d); // lỗi thì dừng ngay, các bản ghi trước đó vẫn nằm trong DB (giống ordered insert thật)
          d.__new = false;
          docs.push(d);
        }
        return arr;
      }
      static async deleteMany(f) {
        for (let i = docs.length - 1; i >= 0; i -= 1) if (matches(docs[i], f)) docs.splice(i, 1);
      }
      static async findOneAndUpdate(f, update) {
        const d = docs.find((x) => matches(x, f));
        if (!d) return null;
        Object.entries(update.$set || {}).forEach(([k, v]) => setPath(d, k, v));
        return d;
      }
    }
    Object.assign(Model.prototype, schema.methods);
    return Model;
  }

  return {
    Schema, model, collections,
    isValidObjectId: (v) => /^[0-9a-f]{24}$/i.test(String(v)),
    set() {}, ObjectId,
  };
}

function createExpress() {
  function Router() {
    const r = { stack: [], routes: [] };
    r.use = (fn) => { r.stack.push(fn); return r; };
    ['get', 'post'].forEach((m) => { r[m] = (p, ...hs) => { r.routes.push({ method: m.toUpperCase(), path: p, hs }); return r; }; });
    return r;
  }
  const express = () => { throw new Error('fake express: app() not supported'); };
  express.Router = Router;
  express.json = () => (_req, _res, next) => next();

  /** Chạy một request giả qua router: dùng được cả middleware, route và error handler. */
  async function call(router, method, url, { body, user } = {}) {
    const [pathname, qs = ''] = url.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs));
    let route; let params = {};
    for (const r of router.routes) {
      if (r.method !== method) continue;
      const names = [];
      const re = new RegExp(`^${r.path.replace(/:([A-Za-z]+)/g, (_m, n) => { names.push(n); return '([^/]+)'; }).replace(/\/$/, '')}/?$`);
      const m = pathname.match(re);
      if (m) { route = r; params = Object.fromEntries(names.map((n, i) => [n, m[i + 1]])); break; }
    }
    if (!route) return { status: 404, body: { message: 'no route in fake router' } };

    const req = { method, params, query, body, headers: { 'x-user': user }, user: undefined };
    return new Promise((resolve) => {
      const res = {
        statusCode: 200,
        status(n) { this.statusCode = n; return this; },
        json(b) { resolve({ status: this.statusCode, body: b }); return this; },
      };
      const chain = [...router.stack.filter((f) => f.length < 4), ...route.hs];
      const fail = (err) => {
        const h = router.stack.find((f) => f.length === 4);
        if (h) return h(err, req, res, (e2) => resolve({ status: 500, body: { message: (e2 || err).message }, error: e2 || err }));
        return resolve({ status: 500, body: { message: err.message }, error: err });
      };
      let i = 0;
      const next = (err) => {
        if (err) return fail(err);
        const fn = chain[i++];
        if (!fn) return resolve({ status: res.statusCode, body: undefined });
        try { return fn(req, res, next); } catch (e) { return fail(e); }
      };
      next();
    });
  }
  return { express, call };
}

/** Nạp các module của server với express/mongoose/auth giả. Trả về routers, models và hàm `call`. */
function loadWithFakes() {
  const mongoose = createMongoose();
  const { express, call } = createExpress();
  const fakeAuth = (req, res, next) => {
    if (!req.headers['x-user']) return res.status(401).json({ message: 'Chưa đăng nhập' });
    req.user = { _id: req.headers['x-user'] };
    return next();
  };
  const srcDir = path.join(__dirname, '..', 'src');
  const original = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === 'express') return express;
    if (request === 'mongoose') return mongoose;
    if (request.endsWith('/middleware/auth')) return fakeAuth;
    return original.call(this, request, parent, isMain);
  };
  Object.keys(require.cache).filter((k) => k.startsWith(srcDir)).forEach((k) => delete require.cache[k]);
  const load = (rel) => require(path.join(srcDir, rel));
  const out = {
    call, mongoose,
    bookingsRouter: load('routes/bookings.js'),
    listingsRouter: load('routes/listings.js'),
    Listing: load('models/Listing.js'),
    Booking: load('models/Booking.js'),
    BookedNight: load('models/BookedNight.js'),
    rules: load('services/bookingRules.js'),
    restore() { Module._load = original; },
  };
  return out;
}

module.exports = { loadWithFakes };
