const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { validationResult } = require("express-validator");
const { sendOtpEmail } = require("../services/email.service");

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      // unverified account — overwrite with new details
      existingUser.password = password;
      existingUser.role = role;
      const otp = existingUser.generateOtp();
      await existingUser.save();
      await sendOtpEmail(email, otp, 'verify');
      return res.status(200).json({
        message: 'OTP sent to your email. Please verify to continue.',
        email,
        requiresVerification: true,
      });
    }

    // new user
    const user = new User({ email, password, role });
    const otp = user.generateOtp();
    await user.save();
    await sendOtpEmail(email, otp, 'verify');

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to continue.',
      email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    console.log('[VERIFY] Stored OTP:', user.otp, '| Entered OTP:', otp, '| Expiry:', user.otpExpiry, '| Now:', new Date());
    if (!user.verifyOtp(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // mark verified, clear OTP
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      user: { id: user._id, email: user.email, role: user.role },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = user.generateOtp();
    await user.save();
    await sendOtpEmail(email, otp, 'verify');

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive) return res.status(403).json({ message: 'Account has been deactivated' });

    // unverified — resend OTP and prompt verification
    if (!user.isEmailVerified) {
      const otp = user.generateOtp();
      await user.save();
      await sendOtpEmail(email, otp, 'verify');
      return res.status(403).json({
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true,
        email,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, role: user.role },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });

    // always respond success to avoid email enumeration
    if (!user || !user.isEmailVerified) {
      return res.json({ message: 'If this email exists, an OTP has been sent.' });
    }

    const otp = user.generateOtp();
    await user.save();
    await sendOtpEmail(email, otp, 'reset');

    res.json({ message: 'If this email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verifyOtp(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, verifyOtp, resendOtp, login, forgotPassword, resetPassword, getMe };
