const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/mailer');
require('dotenv').config();

/* =======================
   HELPERS
======================= */

// Generate 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Generate JWT
const generateToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Normalize email
const normalizeEmail = (email) => email.toLowerCase().trim();

/* =======================
   REGISTER USER
======================= */
const registerUser = async (req, res) => {
  let { name, email, phone, password } = req.body;
  email = normalizeEmail(email);

  try {
    let user = await User.findOne({ email });

    // If user exists but not verified → resend OTP
    if (user && !user.isVerified) {
      const otp = generateOTP();

      user.otp = otp;
      user.otpType = 'signup';
      user.otpExpiry = Date.now() + 10 * 60 * 1000;
      user.otpAttempts = 0;
      await user.save();

      await sendOTPEmail(email, otp, user.name, 'signup');

      return res.json({
        message: 'OTP already sent. Please verify your account.'
      });
    }

    // If user already verified
    if (user && user.isVerified) {
      return res.status(400).json({
        message: 'Account already exists. Please login.'
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpType: 'signup',
      otpExpiry: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      isVerified: false
    });

    await sendOTPEmail(email, otp, name, 'signup');

    res.status(201).json({
      message: 'OTP sent to registered email. Please verify.'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   RESEND OTP
======================= */
const resendOtp = async (req, res) => {
  let { email, type = 'signup' } = req.body;
  email = normalizeEmail(email);

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    if (type === 'signup' && user.isVerified) {
      return res.status(400).json({
        message: 'Account already verified. Please login.'
      });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpType = type;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(email, otp, user.name, type);

    res.json({ message: 'OTP resent successfully' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   VERIFY OTP (AUTO LOGIN)
======================= */
const verifyOtp = async (req, res) => {
  let { email, otp, type = 'signup' } = req.body;
  email = normalizeEmail(email);

  try {
    const user = await User.findOne({ email });

    if (!user || !user.otp)
      return res.status(400).json({ message: 'Invalid OTP' });

// Backward compatibility for users created before otpType existed
const otpType = user.otpType || 'signup';

if (otpType !== type) {
  return res.status(400).json({ message: 'Invalid OTP type' });
}    

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: 'OTP expired' });

    user.otpAttempts += 1;
    if (user.otpAttempts > 5)
      return res.status(429).json({ message: 'Too many attempts. Resend OTP.' });

    if (user.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });

    // Mark verified for signup
    if (type === 'signup') {
      user.isVerified = true;
    }

    user.otp = undefined;
    user.otpType = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;

    await user.save();

    const token = generateToken(user);

    res.json({
      message: 'Account verified and logged in successfully',
      token,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   LOGIN USER
======================= */
const loginUser = async (req, res) => {
  let { email, password } = req.body;
  email = normalizeEmail(email);

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: 'No account found' });

    if (!user.isVerified)
      return res.status(403).json({ message: 'Email not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   GET USER PROFILE
======================= */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json(user);

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   UPDATE PROFILE
======================= */
const updateUserProfile = async (req, res) => {
  try {
    delete req.body.email;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   DELETE ACCOUNT
======================= */
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   FORGOT PASSWORD
======================= */
const forgotPassword = async (req, res) => {
  let { email } = req.body;
  email = normalizeEmail(email);

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'No account found' });

    const otp = generateOTP();

    user.otp = otp;
    user.otpType = 'reset';
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(email, otp, user.name, 'reset');

    res.json({ message: 'OTP sent for password reset' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   RESET PASSWORD
======================= */
const resetPassword = async (req, res) => {
  let { email, password } = req.body;
  email = normalizeEmail(email);

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined;
    user.otpType = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;

    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   EXPORTS
======================= */
module.exports = {
  registerUser,
  resendOtp,
  verifyOtp,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  forgotPassword,
  resetPassword
};
