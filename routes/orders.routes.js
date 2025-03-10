const express = require("express");
const { body } = require("express-validator");
const {
  createOrder,
  getAllOrders,
  deletOrder,
  updateOrder,
  updateOrderStatus,
  getSingleOrder,
} = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .post(
    [
      body("email").isEmail().withMessage("InValid Email"),
      body("fullName").isEmpty().withMessage("fullName is required"),
      body("address").isEmpty().withMessage("address is required"),
      body("phone").isMobilePhone().withMessage("phone is mobile phone"),
    ],
    createOrder
  )
  .get(getAllOrders);

router
  .route("/:orderID")
  .delete(deletOrder)
  .put(authenticate, updateOrder)
  .get(getSingleOrder);
router.route("/:orderID/status").put(updateOrderStatus);

module.exports = router;
