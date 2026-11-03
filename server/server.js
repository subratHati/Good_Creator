const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");


require('./jobs/cleanupUnverifiedUsers')();

const cronRoutes = require('./routes/cron');

const authRoutes = require("./routes/auth.routes");
const creatorRoutes = require("./routes/creator.routes");
const brandRoutes = require("./routes/brand.routes");
const instagramRoutes = require('./routes/instagram.routes');
const openingRoutes = require('./routes/opening.routes');
const applicationRoutes = require('./routes/application.routes');
const chatRoutes = require('./routes/chat.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const collaborationRoutes = require('./routes/collaboration.routes');
const issueRoutes = require('./routes/issue.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const pushRoutes = require('./routes/push.routes');
const collaborationHistoryRoutes = require('./routes/collaborationHistory.routes');
const adminChatRoutes = require('./routes/adminChat.routes');
const assistantRoutes = require('./routes/assistant.routes');
const accountRoutes = require('./routes/account.routes');








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
app.use(compression());

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

app.use(express.json({
  // the Razorpay webhook signature is checked against the exact bytes received,
  // so keep a copy of them for that one route
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/payment/webhook')) req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// TEMPORARY slowness diagnostics (remove after we find the cause)
const inFlight = new Map();      // requests currently running
const justFinished = [];         // requests that finished in the last few seconds
let nextReqId = 0;
app.use((req, res, next) => {
  const start = Date.now();
  const id = ++nextReqId;
  const label = `${req.method} ${req.originalUrl.split('?')[0]}`;
  inFlight.set(id, { start, label });
  res.on('finish', () => {
    const ms = Date.now() - start;
    justFinished.push({ end: Date.now(), label, ms });
    if (justFinished.length > 200) justFinished.shift();
    if (ms > 1000) console.log(`[SLOW] ${label} ${res.statusCode} ${ms}ms`);
  });
  res.on('close', () => inFlight.delete(id));
  next();
});

// Every 250ms: if the timer fires late, the server was frozen. We also note
//  - cpu used vs time passed: close together = our own code was busy computing;
//    far apart = the server was starved of CPU by the host (not our code)
//  - which requests were running, or had just finished, during the freeze
const LAG_TICK = 250;
let lastTick = Date.now();
let lastCpu = process.cpuUsage();
setInterval(() => {
  const now = Date.now();
  const wall = now - lastTick;
  const lag = wall - LAG_TICK;
  const cpu = process.cpuUsage(lastCpu);
  lastCpu = process.cpuUsage();
  if (lag > 300) {
    const cpuMs = Math.round((cpu.user + cpu.system) / 1000);
    const running = [...inFlight.values()].sort((a, b) => a.start - b.start).slice(0, 4)
      .map((r) => `${r.label} (${now - r.start}ms)`);
    const finished = justFinished.filter((r) => r.end >= lastTick).slice(-4)
      .map((r) => `${r.label} (${r.ms}ms)`);
    const mb = Math.round(process.memoryUsage().rss / 1048576);
    console.log(`[LAG] blocked ~${lag}ms | cpu used ${cpuMs}ms of ${wall}ms | running: ${running.join(', ') || 'none'} | finished meanwhile: ${finished.join(', ') || 'none'} | mem ${mb}MB`);
  }
  while (justFinished.length && justFinished[0].end < now - 5000) justFinished.shift();
  lastTick = now;
}, LAG_TICK);

app.use('/api/cron', cronRoutes);

console.log("CLIENT_URL:", process.env.CLIENT_URL);
// routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/openings', openingRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/collaboration-history', collaborationHistoryRoutes);
app.use('/api/admin-chat', adminChatRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/account', accountRoutes);



// health check 
app.get('/api/health', (req, res) => {
  console.log('[HEALTH CHECK] Ping received at', new Date().toISOString());
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

require('./utils/socketHandlers')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

require('./jobs/syncCreatorInsights')();
require('./jobs/syncBrandProfiles')();
require('./jobs/refreshTokens')();