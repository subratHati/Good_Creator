const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const DeletedAccount = require('../models/DeletedAccount');
const { getBlockers, deleteAccount } = require('../services/accountDeletion');
const { checkPickedLocation, checkOutsideLocation } = require('../utils/places');
const calculateQualityScore = require('../utils/calculateQualityScore');

// wrong-password protection: 5 wrong tries locks deleting for 15 minutes
const MAX_WRONG = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map(); // userId -> { count, lockedUntil }

const adminOnly = (req, res, next) =>
    req.user && req.user.role === 'admin'
        ? next()
        : res.status(403).json({ message: 'Admins only' });

const loadProfile = async (user) => {
    if (user.role === 'creator') return Creator.findOne({ userId: user._id });
    if (user.role === 'brand') return Brand.findOne({ userId: user._id });
    return null;
};

// Does this person still have to set their location? (the pop-up asks this on every visit)
router.get('/location-status', protect, async (req, res) => {
    try {
        const profile = await loadProfile(req.user);
        const needed = Boolean(profile && profile.locationReview === true);
        const loc = (profile && profile.location) || {};
        res.json({ needed, city: needed ? (loc.city || '') : '', state: needed ? (loc.state || '') : '' });
    } catch (err) {
        console.error('[ACCOUNT] location-status failed:', err.message);
        res.status(500).json({ message: 'Could not check your location.' });
    }
});

// The pop-up's save. Only a state from the list plus a real city is accepted
// (or, with outsideIndia, a typed city and country). On success the "please set
// your location" flag is cleared and the pop-up never appears again.
router.put('/location', protect, async (req, res) => {
    try {
        if (!['creator', 'brand'].includes(req.user.role)) return res.status(403).json({ message: 'Not available for this account.' });
        const body = req.body || {};
        const picked = body.outsideIndia === true
            ? checkOutsideLocation(body.city, body.state)
            : checkPickedLocation(body.city, body.state);
        if (!picked.ok) return res.status(400).json({ message: picked.message });

        const Model = req.user.role === 'creator' ? Creator : Brand;
        let profile = await Model.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { 'location.city': picked.city, 'location.state': picked.state, locationReview: false } },
            { new: true }
        );
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        if (req.user.role === 'creator') {
            // location is one of the things the quality score looks at
            const score = await calculateQualityScore(profile);
            profile = await Creator.findByIdAndUpdate(profile._id, { qualityScore: score }, { new: true });
        }
        res.json({ message: 'Location saved', location: { city: picked.city, state: picked.state } });
    } catch (err) {
        console.error('[ACCOUNT] save location failed:', err.message);
        res.status(500).json({ message: 'Could not save your location. Please try again.' });
    }
});

// Step 1 of the screen: can this person delete right now, and if not, why?
router.get('/delete-check', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be deleted here.' });
        }
        const profile = await loadProfile(req.user);
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const blockers = await getBlockers(req.user.role, profile);
        res.json({ canDelete: blockers.length === 0, blockers });
    } catch (err) {
        console.error('[ACCOUNT] delete-check failed:', err.message);
        res.status(500).json({ message: 'Could not check your account. Please try again.' });
    }
});

// Step 2: password + reason, then delete immediately
router.post('/delete', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be deleted here.' });
        }

        const key = String(req.user._id);
        const state = attempts.get(key) || { count: 0, lockedUntil: 0 };
        if (state.lockedUntil > Date.now()) {
            const mins = Math.ceil((state.lockedUntil - Date.now()) / 60000);
            return res.status(429).json({ message: `Too many wrong passwords. Try again in ${mins} minute(s).` });
        }

        const { password } = req.body || {};
        if (!password) return res.status(400).json({ message: 'Please enter your password.' });

        const user = await User.findById(req.user._id).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            state.count += 1;
            if (state.count >= MAX_WRONG) {
                state.lockedUntil = Date.now() + LOCK_MS;
                state.count = 0;
            }
            attempts.set(key, state);
            return res.status(400).json({ message: 'Incorrect password.' });
        }
        attempts.delete(key);

        const profile = await loadProfile(user);
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        // never trust the screen: check again here
        const blockers = await getBlockers(user.role, profile);
        if (blockers.length) {
            return res.status(409).json({
                message: 'Your account cannot be deleted yet.',
                blockers,
            });
        }

        const reasonCategory = String((req.body || {}).reasonCategory || '').trim().slice(0, 60);
        const reasonText = String((req.body || {}).reasonText || '').trim().slice(0, 1000);

        await deleteAccount({ user, profile, reasonCategory, reasonText });
        res.json({ message: 'Your account has been deleted.' });
    } catch (err) {
        console.error('[ACCOUNT] delete failed:', err);
        res.status(500).json({ message: 'Something went wrong. Please try again or contact support.' });
    }
});

// Admin: list of deleted accounts and their reasons
router.get('/deleted', protect, adminOnly, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
        const filter = {};
        if (['creator', 'brand'].includes(req.query.role)) filter.role = req.query.role;

        const [accounts, total] = await Promise.all([
            DeletedAccount.find(filter).sort({ deletedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            DeletedAccount.countDocuments(filter),
        ]);
        res.json({ accounts, total, page, pages: Math.ceil(total / limit) || 1 });
    } catch (err) {
        console.error('[ACCOUNT] list deleted failed:', err.message);
        res.status(500).json({ message: 'Failed to load deleted accounts' });
    }
});

module.exports = router;