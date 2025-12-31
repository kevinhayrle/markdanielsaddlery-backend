const express = require('express');
const router = express.Router();

const verifyUserToken = require('../middleware/userMiddleware');

const {
  registerUser,
  resendOtp,      // 👈 THIS WAS MISSING
  verifyOtp,
  loginUser,
   forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  deleteUser
} = require('../controllers/userAuthController');

/* =======================
   AUTH (PUBLIC)
======================= */

// Register new user
router.post('/register', registerUser);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Resend OTP
router.post('/resend-otp', resendOtp);

// Login user
router.post('/login', loginUser);

/* =======================
   PROFILE (PROTECTED)
======================= */

// Get logged-in user profile
router.get('/profile', verifyUserToken, getUserProfile);

// Update logged-in user profile
router.put('/profile', verifyUserToken, updateUserProfile);

// Delete logged-in user
router.delete('/profile', verifyUserToken, deleteUser);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);



module.exports = router;
