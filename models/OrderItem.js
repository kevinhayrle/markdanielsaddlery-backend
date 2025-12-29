const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  size: String,
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

module.exports = mongoose.model("OrderItem", OrderItemSchema);
