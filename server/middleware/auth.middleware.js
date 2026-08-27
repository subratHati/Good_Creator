const jwt = require('jsonwebtoken');
const User = require('../models/User');

// only re-touch lastActiveAt if it's been at least this long since the
// last update — avoids a database write on every single request when a
// user is actively browsing (dozens of requests per minute otherwise)
const ACTIVITY_UPDATE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // fire-and-forget — never block or slow down the actual
        // request waiting on this write
        const isStale = !req.user.lastActiveAt ||
            (Date.now() - new Date(req.user.lastActiveAt).getTime()) > ACTIVITY_UPDATE_THRESHOLD_MS;
        if (isStale) {
            User.findByIdAndUpdate(req.user._id, {
                lastActiveAt: new Date(),
                inactivityNotifiedAt: null, // they're back — clear so a future inactive stretch can notify again
            }).catch(() => { });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Like protect, but never rejects the request — if a valid token is
// present, req.user gets populated (so the route can personalize its
// response); if not, req.user stays undefined and the request proceeds
// as a normal public/logged-out request. Used for routes that should
// stay genuinely public but can optionally enhance the response when
// the requester happens to be logged in (e.g. searchCreators applying
// a category/location match bonus only when a brand is logged in).
const optionalAuth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(); // no token at all — proceed as a public request
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
        // invalid/expired token — don't error out, just proceed without req.user
    }

    next();
};

module.exports = { protect, optionalAuth };