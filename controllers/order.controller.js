const asyncWrapper = require("../middleware/asyncWrapper");
const Order = require("../models/order.model");
const Product = require("../models/product");
const Customer = require("../models/customer.model");
const { createCustomerByOrder } = require("./customer.controller");

// create a new order
const createOrder = asyncWrapper(async (req, res) => {
  const newData = req.body;

  let totalPrice = 0;
  let totalItems = 0;

  if (!newData.products || newData.products.length === 0) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "No products provided" });
  }

  for (const item of newData.products) {
    if (item.quantity <= 0) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Invalid quantity" });
    }
    if (!item.product) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Invalid product id" });
    }
    const product = await Product.findById(item.product);
    if (!product) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Product not found" });
    }
    if (product.quantity < item.quantity) {
      return res.status(400).json({
        status: "ERROR",
        message: `Not enough stock for product ${product.name} (quantity: ${item.quantity}, available: ${product.quantity})`,
      });
    }
    totalPrice += product.price * item.quantity;
    totalItems += item.quantity;
    product.quantity -= item.quantity;
    await product.save();
  }

  newData.totalPrice = totalPrice;
  newData.totalItems = totalItems;

  const newOrder = new Order(newData);
  await newOrder.save();
  await createCustomerByOrder(newOrder);
  res.status(201).json({ status: "SUCCESS", order: newOrder });
});

// get all orders
const getAllOrders = asyncWrapper(async (req, res) => {
  const orders = await Order.find({}).select("-__v");
  // .populate("products.product");
  res.json({ status: "SUCCESS", orders });
});

// get single order
const getSingleOrder = asyncWrapper(async (req, res) => {
  const order = await Order.findById(req.params.orderID)
    .select("-__v")
    .populate("products.product");
  if (!order) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Order not found" });
  }
  res.json({ status: "SUCCESS", order });
});

// delet order
const deletOrder = asyncWrapper(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.orderID);
  if (!order) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Order not found" });
  }
  res.json({ status: "SUCCESS", message: "Order deleted " });
});

// update order
const updateOrder = asyncWrapper(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.orderID, req.body, {
    new: true,
  });
  if (!order) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Order not found" });
  }
  res.json({ status: "SUCCESS", order });
});

// change status of order
const updateOrderStatus = asyncWrapper(async (req, res) => {
  if (!req.body.status) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Status is required" });
  }
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ status: "ERROR", message: "Invalid status" });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.orderID,
    { status: req.body.status },
    { new: true }
  );
  if (!order) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Order not found" });
  }
  res.json({ status: "SUCCESS", order });
});

module.exports = {
  createOrder,
  getAllOrders,
  deletOrder,
  updateOrder,
  updateOrderStatus,
  getSingleOrder,
};
