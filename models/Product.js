const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,

  price: { type: Number, required: true },
  discountedPrice: Number,

  imageUrl: String,                
  extra_images: { type: [String], default: [] },

  category: String,
  sizes: { type: [String], default: [] }

}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model("Product", ProductSchema);
