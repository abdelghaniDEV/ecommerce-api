const asyncWrapper = require("../middleware/asyncWrapper");
const Order = require("../models/order.model");
const Product = require("../models/product");
const Customer = require("../models/customer.model");
const { createCustomerByOrder } = require("./customer.controller");
const { default: mongoose } = require("mongoose");
// const product = require("../models/product");

// create a new order
const createOrder = asyncWrapper(async (req, res) => {
  const newData = req.body;

  if (!newData.products || newData.products.length === 0) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "No products provided" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalPrice = 0;
    let totalItems = 0;

    // get all products
    const productIds = newData.products.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).session(
      session
    );

    if (products.length !== newData.products.length) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Some products were not found" });
    }

    // التحقق من توفر الكمية وتحديث المخزون
    for (const item of newData.products) {
      if (item.quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Not enough stock for product ${product.name} (available: ${product.quantity}, required: ${item.quantity})`
        );
      }

      totalPrice += product.price * item.quantity;
      totalItems += item.quantity;
      product.quantity -= item.quantity;
      console.log(product);
    }

    await Promise.all(
      products.map((product) =>
        Product.updateOne(
          { _id: product._id },
          { $set: { quantity: product.quantity } },
          { session }
        )
      )
    );

    const lastOrder = await Order.findOne()
      .sort({ createdAt: -1 })
      .session(session);
    let lastOrderNumber = 0;

    if (lastOrder && lastOrder.orderCode) {
      const match = lastOrder.orderCode.match(/ORD-(\d+)/);
      if (match) {
        lastOrderNumber = parseInt(match[1], 10);
      }
    }

    // توليد كود الطلب الجديد
    const newOrderNumber = (lastOrderNumber + 1).toString().padStart(2, "0"); // 01, 02, 03...
    const orderCode = `ORD-${newOrderNumber}`;

    // إنشاء الطلب
    newData.totalPrice = totalPrice;
    newData.totalItems = totalItems;
    newData.orderCode = orderCode;
    const newOrder = new Order(newData);
    await newOrder.save({ session });

    // حفظ العميل المرتبط بالطلب
    await createCustomerByOrder(newOrder, session);

    // تأكيد جميع العمليات
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ status: "SUCCESS", order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ status: "ERROR", message: error.message });
  }
});

// get all orders
const getAllOrders = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page || 10);
  const limit = parseInt(req.query.limit || 10);
  const search = req.query.search || "";
  const startDate = parseInt(
    req.query.startDate ? new Date(req.query.startDate) : null
  );
  const endDate = parseInt(
    req.query.endDate ? new Date(req.query.endDate) : null
  );
  const status = req.query.status || null;
  const skip = (page - 1) * limit;

  let = filter = {};

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { orderCode: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  // filter by date
  if (startDate && endDate) {
    filter.createdAt = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.createdAt = { $gte: startDate };
  } else if (endDate) {
    filter.createdAt = { $lte: endDate };
  }

  // filter by status
  if (status) {
    filter.status = status;
  }

  // calculate total revenue
  const revenueResult = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
        totalDeliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
      },
    },
  ]);
  const totalRevenue = revenueResult.length ? revenueResult[0].totalRevenue : 0;
  const totalOrders = revenueResult.length ? revenueResult[0].totalOrders : 0;
  // const totalDeliveredOrders = revenueResult.length ? revenueResult[0].totalDeliveredOrders : 0;

  const orders = await Order.find(filter)
    .skip(skip)
    .limit(limit)
    .select("-__v");

  const totalProducts = await Product.countDocuments();
  const totalPages = Math.ceil(totalOrders / limit);

  res.json({
    status: "SUCCESS",
    orders,
    currentPage: page,
    totalPages,
    totalOrders,
    totalRevenue: totalRevenue.toFixed(2),
    totalProducts,
  });
});

// get single order
const getSingleOrder = asyncWrapper(async (req, res) => {
  const order = await Order.findById(req.params.orderID)
    .select("-__v")
    .populate({
      path: "products.product",
      populate: {
        path: "categories",
      },
    });

  if (!order) {
    return res.status(404).json({ status: "ERROR", message: "Order not found" });
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
    "confirmed",
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
