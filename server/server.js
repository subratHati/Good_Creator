const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const creatorRoutes = require("./routes/creator.routes");
const brandRoutes = require("./routes/brand.routes");
const instagramRoutes = require('./routes/instagram.routes');
const openingRoutes = require('./routes/opening.routes');
const applicationRoutes = require('./routes/application.routes');
const enquiriesRoutes = require('./routes/enquiry.routes');


connectDB();

const app = express();

//security
app.use(helmet());

// rate limit auth routes - max 20 requests per 15 min per IP 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many requests, please try again later' },
});

// middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

// health check 
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CollabSpace API running' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

require('./jobs/syncCreatorInsights')();
require('./jobs/syncBrandProfiles')();
require('./jobs/refreshTokens')();