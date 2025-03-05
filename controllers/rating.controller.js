const { default: mongoose } = require("mongoose");
const asyncWrapper = require("../middleware/asyncWrapper");
const Rating = require("../models/rating.model");
const Product = require("../models/product");
const { validationResult } = require("express-validator");

// create a new rating
const createRating = asyncWrapper(async (req, res) => {
  const newData = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "ERROR",
      errors: errors.array(),
    });
  }

  if (!mongoose.Types.ObjectId.isValid(newData.product)) {
    console.log("productsId", newData.product);
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid product ID",
    });
  }

  const productExists = await Product.findById(newData.product);
  if (!productExists) {
    return res.status(404).json({
      status: "ERROR",
      message: "Product not found",
    });
  }

  const findRating = await Rating.findOne({
    email: newData.email,
    product: newData.product,
  });

  if (findRating) {
    return res.status(400).json({
      status: "ERROR",
      message: "You have already rated this product",
    });
  }

  if (newData.rating < 1 || newData.rating > 5) {
    return res.status(400).json({
      status: "ERROR",
      message: "Rating must be between 1 and 5",
    });
  }

  if (req.file) {
    newData.image = req.file.path;
  }

  const rating = await Rating.create(newData);

  const product = await Product.findByIdAndUpdate(newData.product, {
    $push: { ratings: rating._id },
  });

  res.json({
    status: "SUCCESS",
    message: "Rating created successfully",
    rating,
  });
  // update product
});

// get all ratings
const getRatings = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const ratings = await Rating.find({})
    .populate({
      path: "product",
      populate: {
        path: "categories",
      },
    })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const totalReviews = await Rating.countDocuments();
  const goodReviews = await Rating.countDocuments({ rating: { $gte: 4 } });
  const badReviews = await Rating.countDocuments({ rating: { $lte: 2 } });

  // حساب متوسط التقييمات باستخدام aggregate
  const averageRatingResult = await Rating.aggregate([
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  const averageRating =
    averageRatingResult.length > 0 ? averageRatingResult[0].avgRating : 0;

  res.status(200).json({
    status: "SUCCESS",
    count: ratings.length,
    totalReviews,
    goodReviews,
    badReviews,
    averageRating: averageRating.toFixed(2), // تقريب الرقم العشري إلى خانتين
    totalPages: Math.ceil(totalReviews / limit),
    currentPage: page,
    data: ratings,
  });
});

// delete rating
const deleteRating = asyncWrapper(async (req, res) => {
  const rating = await Rating.findByIdAndDelete(req.params.ratingID);
  if (!rating) {
    return res.status(404).json({
      status: "ERROR",
      message: "Rating not found",
    });
  }
  res.json({
    status: "SUCCESS",
    message: "Rating deleted successfully",
  });
});

const getRatingByProductID = asyncWrapper(async (req, res) => {
  const ratings = await Rating.find({ product: req.params.ratingID });
  // console.log(req.params.productID)
  res.json({
    status: "SUCCESS",
    count: ratings.length,
    ratings,
  });
});

module.exports = {
  createRating,
  getRatings,
  deleteRating,
  getRatingByProductID,
};
