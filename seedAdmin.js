const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    email: "mds@gmail.com",
    password: hashedPassword
  });

  console.log("✅ Admin created");
  process.exit();
})();
