const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");

exports.getOrdersByPhone = async (req, res) => {
  const { phone } = req.params;

  try {
    // 1️⃣ Get orders by phone
    const orders = await Order
      .find({ phone })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o._id);

    // 2️⃣ Get order items + product info
    const items = await OrderItem
      .find({ orderId: { $in: orderIds } })
      .populate("productId", "name imageUrl")
      .lean();

    // 3️⃣ Group items by order
    const itemsByOrder = {};
    items.forEach(item => {
      const orderId = item.orderId.toString();

      if (!itemsByOrder[orderId]) {
        itemsByOrder[orderId] = [];
      }

      itemsByOrder[orderId].push({
        name: item.productId?.name,
        image_url: item.productId?.imageUrl,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      });
    });

    // 4️⃣ Attach items to orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: itemsByOrder[order._id.toString()] || []
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
