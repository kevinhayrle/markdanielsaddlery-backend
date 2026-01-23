const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");

/*
================================================
✅ ADD PRODUCT (ADMIN)
================================================
*/
exports.addProduct = async (req, res) => {
  const {
    name,
    description,
    price,
    discounted_price,
    image_url,
    category,
    sizes,
    extra_images
  } = req.body;

  if (!name || !price || !image_url) {
    return res.status(400).json({
      error: "Name, price, and image are required."
    });
  }

  try {
    // 1️⃣ Create product
    const product = await Product.create({
      name,
      description,
      price,
      discountedPrice: discounted_price,
      imageUrl: image_url,
      category,
      sizes: Array.isArray(sizes)
        ? sizes
        : typeof sizes === "string"
        ? sizes.split(",")
        : []
    });

    // 2️⃣ Extra images
    const normalizedExtraImages =
      Array.isArray(extra_images)
        ? extra_images
        : typeof extra_images === "string"
        ? extra_images.split(",").map(s => s.trim())
        : [];

    if (normalizedExtraImages.length > 0) {
      const images = normalizedExtraImages.map(img => ({
        productId: product._id,
        imageUrl: img
      }));

      await ProductImage.insertMany(images);
    }

    res.status(201).json({ message: "Product added successfully." });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Server error while adding product." });
  }
};

/*
================================================
✅ GET ALL PRODUCTS
================================================
*/
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product
      .find()
      .lean();

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error." });
  }
};

/*
================================================
✅ GET PRODUCT BY ID
================================================
*/
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const images = await ProductImage.find({ productId: id }).lean();

    product.extra_images = images.map(img => img.imageUrl);

    res.json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ error: "Server error." });
  }
};

/*
================================================
✅ UPDATE PRODUCT
================================================
*/
exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    price,
    discounted_price,
    image_url,
    category,
    sizes,
    extra_images
  } = req.body;

  if (!id || !name || !price || !image_url || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    await Product.findByIdAndUpdate(id, {
      name,
      description,
      price,
      discountedPrice: discounted_price,
      imageUrl: image_url,
      category,
      sizes: Array.isArray(sizes)
        ? sizes
        : typeof sizes === "string"
        ? sizes.split(",")
        : []
    });

    // Replace extra images
    await ProductImage.deleteMany({ productId: id });

    const normalizedExtraImages =
      Array.isArray(extra_images)
        ? extra_images
        : typeof extra_images === "string"
        ? extra_images.split(",").map(s => s.trim())
        : [];

    if (normalizedExtraImages.length > 0) {
      const images = normalizedExtraImages.map(img => ({
        productId: id,
        imageUrl: img
      }));

      await ProductImage.insertMany(images);
    }

    res.json({ message: "Product updated successfully." });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Server error during product update." });
  }
};

/*
================================================
✅ GET ALL CATEGORIES
================================================
*/
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/*
================================================
✅ DELETE PRODUCT
================================================
*/
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await ProductImage.deleteMany({ productId: id });
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Server error while deleting product." });
  }
};
