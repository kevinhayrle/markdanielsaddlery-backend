const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/adminMiddleware');
const { adminLogin } = require('../controllers/adminAuthController');

const {
  getAllProducts,
  deleteProduct,
  addProduct,
  updateProduct,
} = require('../controllers/productController');

const {
  addCoupon,
  getAllCoupons,
  deleteCoupon
} = require('../controllers/couponController');

/* =======================
   AUTH
======================= */

router.post('/login', adminLogin);

/* =======================
   PRODUCT ROUTES (FIXED)
======================= */

router.get('/products', verifyToken, getAllProducts);
router.post('/products', verifyToken, addProduct);
router.put('/products/:id', verifyToken, updateProduct);
router.delete('/products/:id', verifyToken, deleteProduct);

/* =======================
   COUPON ROUTES
======================= */

router.post('/coupons/add', verifyToken, addCoupon);
router.get('/coupons', verifyToken, getAllCoupons);
router.delete('/coupons/delete/:id', verifyToken, deleteCoupon);

module.exports = router;
