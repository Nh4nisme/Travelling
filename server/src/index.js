require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('❌ Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
