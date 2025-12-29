const mongoose = require("mongoose");

const ProductImageSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  imageUrl: { type: String, required: true }
});

module.exports = mongoose.model("ProductImage", ProductImageSchema);
