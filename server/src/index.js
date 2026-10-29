require('./config/loadEnv');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/listings', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));

app.use((err, _req, res, _next) => {
  console.error('API request failed:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('❌ Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
