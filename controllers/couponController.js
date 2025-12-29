const Coupon = require("../models/Coupon");

/*
================================================
✅ ADD COUPON (ADMIN)
POST /api/admin/coupons/add
================================================
*/
exports.addCoupon = async (req, res) => {
  const {
    coupon_code,
    discount_type,
    discount_value,
    min_cart_value,
    max_discount,
    expiry_date
  } = req.body;

  if (!coupon_code || !discount_type || !discount_value) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  try {
    await Coupon.create({
      couponCode: coupon_code,
      discountType: discount_type,
      discountValue: discount_value,
      minCartValue: min_cart_value || 0,
      maxDiscount: max_discount || null,
      expiryDate: expiry_date || null,
      isActive: true
    });

    res.status(201).json({ message: "Coupon added successfully." });
  } catch (err) {
    console.error("Error adding coupon:", err);

    // duplicate coupon code
    if (err.code === 11000) {
      return res.status(409).json({ error: "Coupon code already exists." });
    }

    res.status(500).json({ error: "Server error while adding coupon." });
  }
};

/*
================================================
✅ GET ALL COUPONS (ADMIN)
GET /api/admin/coupons
================================================
*/
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error("Error fetching coupons:", err);
    res.status(500).json({ error: "Server error while fetching coupons." });
  }
};

/*
================================================
✅ DELETE COUPON (ADMIN)
DELETE /api/admin/coupons/delete/:id
================================================
*/
exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Coupon not found." });
    }

    res.json({ message: "Coupon deleted successfully." });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({ error: "Server error while deleting coupon." });
  }
};

/*
================================================
✅ APPLY COUPON (USER)
POST /api/coupons/apply
================================================
*/
exports.applyCoupon = async (req, res) => {
  const { coupon_code, cart_total } = req.body;

  if (!coupon_code || !cart_total) {
    return res.status(400).json({
      error: "Coupon code and cart total are required."
    });
  }

  try {
    const coupon = await Coupon.findOne({
      couponCode: coupon_code,
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({ error: "Invalid or inactive coupon." });
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return res.status(400).json({ error: "Coupon has expired." });
    }

    if (cart_total < coupon.minCartValue) {
      return res.status(400).json({
        error: `Minimum cart value ₹${coupon.minCartValue} required`
      });
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (cart_total * coupon.discountValue) / 100;

      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    const final_total = Math.max(cart_total - discount, 0);

    res.json({
      success: true,
      discount: Math.round(discount),
      final_total: Math.round(final_total),
      coupon_code: coupon.couponCode
    });
  } catch (err) {
    console.error("Error applying coupon:", err);
    res.status(500).json({ error: "Server error while applying coupon." });
  }
};
