require('./config/loadEnv');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.io với cấu hình CORS cho phép mọi client (web, mobile simulator, thiết bị thật)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Quản lý các sự kiện Socket.io Realtime
io.on('connection', (socket) => {
  console.log('⚡ Client connected to socket:', socket.id);

  socket.on('error', (err) => {
    console.warn(`Socket ${socket.id} error:`, err?.message);
  });

  // Người dùng tham gia vào phòng chat của 1 hội thoại cụ thể
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    }
  });

  // Người dùng rời khỏi phòng chat
  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
    }
  });

  // Bắt đầu gõ phím -> thông báo cho đối phương trong phòng
  socket.on('typing:start', (data) => {
    if (data?.conversationId) {
      socket.to(data.conversationId).emit('typing:start', data);
    }
  });

  // Ngừng gõ phím
  socket.on('typing:stop', (data) => {
    if (data?.conversationId) {
      socket.to(data.conversationId).emit('typing:stop', data);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client ${socket.id} disconnected: ${reason}`);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Server uncaughtException:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Server unhandledRejection:', reason);
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/listings', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api/bookings', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/support', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use('/api/chat', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, socket: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/support', require('./routes/support'));
app.use('/api/chat', require('./routes/chat'));

app.use((err, _req, res, _next) => {
  console.error('API request failed:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
connectDB()
  .then(async () => {
    await Promise.all([
      require('./models/Booking').init(),
      require('./models/BookedNight').init(),
      require('./models/Conversation').init(),
      require('./models/Message').init(),
    ]);
    server.listen(PORT, '0.0.0.0', () => console.log(`🚀 API & Realtime Socket chạy tại http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
