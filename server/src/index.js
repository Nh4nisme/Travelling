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

  socket.on('error', (err) => {
  });

  // Người dùng tham gia vào phòng chat của 1 hội thoại cụ thể
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
    }
  });

  // Người dùng rời khỏi phòng chat
  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
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
app.use('/api/payments', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, socket: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/support', require('./routes/support'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/payments', require('./routes/payments'));

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
      require('./models/PaymentMethod').init(),
    ]);

    // Đồng bộ tài khoản Host thật và gắn vào tất cả các Listing (chạy êm)
    try {
      const seedAllHostsAndListings = require('./seedAllHostsAndListings');
      await seedAllHostsAndListings();
    } catch {}

    // Hỗ trợ xóa sạch lịch sử chat nếu cờ CLEAR_CHAT_ON_START được bật
    if (process.env.CLEAR_CHAT_ON_START === 'true') {
      try {
        const Conversation = require('./models/Conversation');
        const Message = require('./models/Message');
        await Conversation.deleteMany({});
        await Message.deleteMany({});
      } catch {}
    }

    // Dọn dẹp conversation trùng (cùng cặp host-renter) khi server khởi động (chạy êm)
    try {
      const Conversation = require('./models/Conversation');
      const Message = require('./models/Message');
      const all = await Conversation.find({}).sort({ createdAt: 1 }).lean();
      const groupMap = new Map();
      for (const c of all) {
        const key = [c.host.toString(), c.renter.toString()].sort().join('|');
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(c);
      }
      for (const group of groupMap.values()) {
        if (group.length <= 1) continue;
        const toDelete = group.slice(1).map((c) => c._id);
        await Message.deleteMany({ conversation: { $in: toDelete } });
        await Conversation.deleteMany({ _id: { $in: toDelete } });
      }
    } catch {}

    server.listen(PORT, '0.0.0.0', () => console.log(`🚀 API & Realtime Socket chạy tại http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
