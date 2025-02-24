const express = require("express");
const {
  createRating,
  getRatings,
  deleteRating,
  getRatingByProductID,
} = require("../controllers/rating.controller");
const { body } = require("express-validator");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Cloudinary = require("../config/cloudinary");
const multer = require("multer");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: Cloudinary,
  params: {
    folder: "uploads",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

router
  .route("/")
  .post(
    upload.single("image"),
    [
      body("email").isEmail().withMessage("invalid Email"),
      body("fullName").notEmpty().withMessage("Full Name is required"),
      body("rating").notEmpty().withMessage("Rating is required"),
    ],
    createRating
  )
  .get(getRatings);

router.route("/:ratingID").delete(deleteRating).get(getRatingByProductID);

module.exports = router;
