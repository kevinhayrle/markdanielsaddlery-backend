const express = require('express');
const router = express.Router();

const {
  applyCoupon,
  getPublicCoupons
} = require('../controllers/couponController');

/*
=================================
✅ GET ACTIVE COUPONS (PUBLIC)
GET /api/coupons
=================================
*/
router.get('/', getPublicCoupons);

/*
=================================
✅ APPLY COUPON (USER / CART)
POST /api/coupons/apply
=================================
*/
router.post('/apply', applyCoupon);

module.exports = router;
