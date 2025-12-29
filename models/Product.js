const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  discountedPrice: Number,
  imageUrl: String,
  category: String,
  sizes: [String],         // ["S","M","L","XL"]
  sortOrder: Number
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("Product", ProductSchema);
