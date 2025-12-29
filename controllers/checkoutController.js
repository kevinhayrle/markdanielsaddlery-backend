const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const { sendOrderEmail } = require("../utils/mailer");

require("dotenv").config();

exports.handleCheckout = async (req, res) => {
  try {
    const { name, email, phone, address, cart, payment, total_amount } = req.body;

    if (!payment || !cart || cart.length === 0) {
      return res.status(400).json({ message: "Missing payment or cart info" });
    }

    // 1️⃣ Create Order
    const order = await Order.create({
      name,
      email,
      phone,
      address,
      payment,
      totalAmount: total_amount
    });

    // 2️⃣ Create Order Items
    const orderItems = cart.map(item => ({
      orderId: order._id,
      productId: item.id,        // should be ObjectId from frontend
      size: item.size,
      quantity: item.quantity,
      price: item.price
    }));

    await OrderItem.insertMany(orderItems);

    // 3️⃣ Send email (unchanged)
    await sendOrderEmail({
      name,
      email,
      phone,
      address,
      cart,
      payment,
      total_amount,
    });

    res.status(200).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error in handleCheckout:", error);
    res.status(500).json({ message: "Failed to process order" });
  }
};
