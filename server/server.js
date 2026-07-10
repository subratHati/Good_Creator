const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

require('./jobs/cleanupUnverifiedUsers')();

const authRoutes = require("./routes/auth.routes");
const creatorRoutes = require("./routes/creator.routes");
const brandRoutes = require("./routes/brand.routes");
const instagramRoutes = require('./routes/instagram.routes');
const openingRoutes = require('./routes/opening.routes');
const applicationRoutes = require('./routes/application.routes');
const enquiriesRoutes = require('./routes/enquiry.routes');
const chatRoutes = require('./routes/chat.routes');
const paymentRoutes = require('./routes/payment.routes');



connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_WWW,
  process.env.CLIENT_URL_VERCEL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

app.set('io', io);

app.set('trust proxy', 1);

//security
app.use(helmet());

// rate limit auth routes - max 20 requests per 15 min per IP 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later' },
});

// middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      process.env.CLIENT_URL,
      process.env.CLIENT_URL_WWW,
      process.env.CLIENT_URL_VERCEL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("CLIENT_URL:", process.env.CLIENT_URL);
// routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/openings', openingRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

// health check 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// global error handler 
app.use((err, req, res, next) => {
  console.error('Global error:', err);  // change this line
  res.status(500).json({ message: 'Something went wrong' });
});

io.on('connection', (socket) => {
  console.log('[SOCKET] User connected:', socket.id);

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(`conversation_${conversationId}`).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET] User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

require('./jobs/syncCreatorInsights')();
require('./jobs/syncBrandProfiles')();
require('./jobs/refreshTokens')();