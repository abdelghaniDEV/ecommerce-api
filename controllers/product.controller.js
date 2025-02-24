const Product = require("../models/product");
const Category = require("../models/category");
const asyncWrapper = require("../middleware/asyncWrapper");
const  Cloudinary  = require('../config/cloudinary')

// create new product
const createProduct = asyncWrapper(async (req, res) => {
  const newProduct = req.body;

  if (req.files && req.files.length > 0) {
    newProduct.images = req.files.map((file) => file.path);
  }

  const product = new Product(newProduct);
  await product.save();

  res.status(201).json({
    status: "SUCCESS",
    message: "Product created successfully",
    product: product,
  });
});

// get all products
const getProducts = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const stock = req.query.stock || "";
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;
  let categories = req.query.category || "";
  const size = req.query.size || ""; // New filter for size

  console.log("category" , categories);
  

  let filter = {};

  // 🔹 Search Filter
  if (search) {
   
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // 🔹 Stock status filter
  if (stock === "instock") {
    filter.stock = { $gt: 10 }; // More than 10 items
  } else if (stock === "lowstock") {
    filter.stock = { $gt: 0, $lte: 10 }; // Between 1 and 10
  } else if (stock === "outstock") {
    filter.stock = 0; // No stock left
  }

  // 🔹 Price Range Filter
  filter.price = { $gte: minPrice, $lte: maxPrice };

  // 🔹 Category Filter
  if (categories) {
    console.log("categories" , categories);
    const categoryNames = categories.split(","); // Convert string to array
    const categoryDocs = await Category.find({
      name: { $in: categoryNames },
    }).select("_id"); // Find matching categories
    const categoryIds = categoryDocs.map((cat) => cat._id); // Extract ObjectIds
    if (categoryIds.length > 0) {
      filter.categories = { $in: categoryIds };
    }
  }

  // 🔹 Size Filter (Assuming "sizes" is an array in your product schema)
  if (size) {
    const sizesArray = size.split(","); // Allow multiple sizes
    filter.size = { $in: sizesArray };
  }

  // 🔹 Fetch Products
  const products = await Product.find(filter)
    .select("-__v")
    .populate("categories", "-__v -products")
    .populate("ratings", "-__v")
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);



  // 🔹 Count Total Products
  const totalProducts = await Product.countDocuments(filter);

  // 🔹 Send Response
  res.status(200).json({
    status: "SUCCESS",
    count: products.length,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page,
    products,
  });
});

// get single product
const getSingleProduct = asyncWrapper(async (req, res) => {
  const { productID } = req.params;
  const product = await Product.findById(productID)
    .select("-__v")
    .populate("categories", "-__v -products")
    .populate("ratings", "-__v -product");

  if (!product) {
    return res.status(404).json({
      status: "ERROR",
      message: "Product not found",
    });
  }

  res.json({
    status: "SUCCESS",
    product: product,
    rating: {
      count: product.ratings.length,
      average:
        product.ratings.reduce((acc, rating) => acc + rating.rating, 0) /
        product.ratings.length,
    },
  });
});

// update products
const updateProduct = asyncWrapper(async (req, res) => {
  const { productID } = req.params;
  let updatedProduct = req.body;

  // استخراج الصور القديمة من `req.body`
  const existingImages = JSON.parse(req.body.existingImages || "[]");

  // جلب المنتج من قاعدة البيانات
  const product = await Product.findById(productID);
  if (!product) {
    return res.status(404).json({
      status: "ERROR",
      message: "Product not found",
    });
  }

  // تحديد الصور التي سيتم حذفها
  const imagesToDelete = product.images.filter((img) => !existingImages.includes(img));

  // حذف الصور غير المرغوب فيها من Cloudinary
  await Promise.all(
    imagesToDelete.map(async (img) => {
      const publicId = img.split("/").pop().split(".")[0]; // استخراج الـ `public_id` من الرابط
      await Cloudinary.uploader.destroy(publicId);
    })
  );

  let updatedImages = [...existingImages]; // الاحتفاظ بالصور القديمة المطلوبة

  // إضافة الصور الجديدة إن وجدت
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => file.path);
    updatedImages = [...updatedImages, ...newImages];
  }

  // تحديث المنتج بالبيانات الجديدة
  updatedProduct.images = updatedImages;
  const updatedProductData = await Product.findByIdAndUpdate(productID, updatedProduct, {
    new: true,
    runValidators: true,
  });

  res.json({
    status: "SUCCESS",
    message: "Product updated successfully",
    product: updatedProductData,
  });
});


// delete product
const deleteProducts = asyncWrapper(async (req, res) => {
  const { productID } = req.params;
  const product = await Product.findByIdAndDelete(productID);

  if (!product) {
    return res.status(404).json({
      status: "ERROR",
      message: "Product not found",
    });
  }

  res.json({
    status: "SUCCESS",
    message: "Product deleted successfully",
  });
});

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProducts,
  getSingleProduct,
};
