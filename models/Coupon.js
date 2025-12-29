const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  couponCode: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percentage", "flat"], required: true },
  discountValue: { type: Number, required: true },
  minCartValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("Coupon", CouponSchema);
