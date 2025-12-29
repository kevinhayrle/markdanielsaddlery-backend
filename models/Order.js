const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,

  payment: String,
  totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
