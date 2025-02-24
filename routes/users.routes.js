const express = require("express");
const {
  createUser,
  getUsers,
  deleteUser,
  login,
  logout,
  changePassword,
  getProfile,
  updateProfile,
} = require("../controllers/user.controller");
const { body } = require("express-validator");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: Cloudinary,
  params: {
    folder: "uploads",
    allowedFormats: ["jpg", "png", "jpeg"],
    // transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

router
  .route("/")

  .post(
    upload.single("image"),
    [
      body("fullName").notEmpty().withMessage("fullName is required"),
      body("email").isEmail().withMessage("Invalid email"),
      body("password")
        .notEmpty()
        .withMessage("password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    ],

    createUser
  )
  .get( getUsers);

router.route("/:userID").delete(authenticate, authorize(["admin"]), deleteUser);

router.route("/login").post(login);

router.route("/logout").post(authenticate, logout);

router.route("/changePassword").post(authenticate, changePassword);

router
  .route("/profile")
  .get(authenticate, getProfile)
  .put(authenticate, upload.single("image"), updateProfile);

module.exports = router;
