const express = require('express');
const router = express.Router();

const verifyUserToken = require('../middleware/userMiddleware');

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userAuthController');

/* =======================
   AUTH (PUBLIC)
======================= */

// Register new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

/* =======================
   PROFILE (PROTECTED)
======================= */

// Get logged-in user profile
router.get('/profile', verifyUserToken, getUserProfile);

// Update logged-in user profile
router.put('/profile', verifyUserToken, updateUserProfile);

module.exports = router;
