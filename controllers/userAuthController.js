const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/mailer');
require('dotenv').config();

/* =======================
   HELPER : GENERATE OTP
======================= */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/* =======================
   USER REGISTER
======================= */
const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // regenerate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        existingUser.otp = otp;
        existingUser.otpExpiry = otpExpiry;
        await existingUser.save();

        await sendOTPEmail(email, otp, existingUser.name, 'signup');

        return res.status(200).json({
          message: 'OTP already sent. Please verify your account.'
        });
      }

      return res.status(400).json({ message: 'Account already exists. Please Sign in' });
    }

    // Hash password (UNCHANGED)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create user (EXTENDED, NOT CHANGED)
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false
    });

    // Send OTP email via Mailjet
    await sendOTPEmail(email, otp, name, 'signup');

    res.status(201).json({
      message: 'OTP sent to registered email. Please verify.'
    });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   RESEND OTP (ADDED ONLY)
======================= */
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

 if (!user.isVerified) {
  return res.status(403).json({
    message: 'Please verify your email first'
  });
}


    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(user.email, otp, user.name, 'signup');

    res.json({ message: 'OTP resent successfully' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   VERIFY OTP
======================= */
const verifyOtp = async (req, res) => {
  const { email, otp, type = 'signup'} = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Invalid OTP' });
    }

    if (type == 'signup' && user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified
if (type === 'signup') {
  user.isVerified = true;
}

user.otp = undefined;
user.otpExpiry = undefined;

    await user.save();

    res.json({ message: 'Account verified successfully' });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   USER LOGIN
======================= */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
  const user = await User.findOne({ email });

if (!user) {
  return res.status(404).json({
    message: 'No account found for this email'
  });
}


    // BLOCK LOGIN IF NOT VERIFIED
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Your email is not verified. Sign up again'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   GET USER PROFILE
======================= */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   UPDATE USER PROFILE
======================= */
const updateUserProfile = async (req, res) => {
  try {
    // Prevent email update at backend level
    if (req.body.email) {
      delete req.body.email;
    }

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
   DELETE USER ACCOUNT
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
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'No account found for this email'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(user.email, otp, user.name, 'reset');

    res.json({
      message: 'OTP sent to your email to reset password'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =======================
   RESET PASSWORD
======================= */
const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  registerUser,
  resendOtp,   // 👈 ADDED
  verifyOtp,
  loginUser,
   forgotPassword,   // 👈 ADD
  resetPassword, 
  getUserProfile,
  updateUserProfile,
  deleteUser
};
