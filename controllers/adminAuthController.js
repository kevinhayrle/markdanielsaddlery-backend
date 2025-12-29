const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔁 MySQL SELECT → Mongo findOne
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { adminLogin };
