const express = require('express');
const router = express.Router();

const { applyCoupon } = require('../controllers/couponController');

/*
=================================
✅ APPLY COUPON (USER / CART)
POST /api/coupons/apply
=================================
*/
router.post('/apply', applyCoupon);

module.exports = router;
