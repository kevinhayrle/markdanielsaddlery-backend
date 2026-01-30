require('dotenv').config();
const express = require('express');
const cors = require("cors");

const connectDB = require("./db"); // MongoDB connection
const publicProductRoutes = require('./routes/publicProductRoutes');

console.log('👋 Mark Daniel Saddlery backend started');

const app = express();

/* ------------------
   MongoDB Connect
------------------ */
connectDB();

/* ------------------
   Middleware
------------------ */
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());
console.log('✅ express.json middleware loaded');

/* ------------------
   Routes
------------------ */
try {
  const adminRoutes = require('./routes/adminRoutes');
  const couponRoutes = require('./routes/couponRoutes');
  const checkoutRoutes = require("./routes/checkoutRoutes");
  const orderRoutes = require("./routes/orderRoutes");
  const userRoutes = require('./routes/UserRoutes');


  app.use('/api/products', publicProductRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/users', userRoutes);


  console.log('✅ Routes registered');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
}

/* ------------------
   Health Check
------------------ */
app.get('/', (req, res) => {
  res.send('Mark Daniel Saddlery backend is running ✅');
});

/* ------------------
   Start Server
------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mark Daniel Saddlery backend running on port ${PORT}`);
});

