const asyncWrapper = require("../middleware/asyncWrapper");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");

const createCustomer = asyncWrapper(async (req, res) => {
  const newData = req.body;
});

const createCustomerByOrder = async (order) => {
  try {
    const findCustomer = await Customer.findOne({ email: order.email });
    const newData = {
      fullName: order.fullName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      totalItems: order.products.length,
      totalOrders: 1,
      totalAmount: order.totalPrice,
    };
    if (findCustomer) {
      findCustomer.orders.push({ order: order._id });
      findCustomer.totalOrders = findCustomer.orders.length;
      findCustomer.totalAmount += order.totalPrice;
      findCustomer.totalItems += order.products.length;
      findCustomer.updated_at = order.updatedAt;
      await findCustomer.save();
    } else {
      const newCustomer = new Customer(newData);
      newCustomer.orders.push({ order: order._id });
      await newCustomer.save();
    }
  } catch (err) {
    console.error("Error creating/updating customer:", err);
    throw new Error("Error creating customer from order");
  }
};

const getAllCustomer = asyncWrapper(async (req, res) => {
  const customers = await Customer.find({})
    .select("-__v")
    .populate("orders.order")
    .populate({
      path: "orders.order",
      populate: {
        path: "products.product",
      },
    });
  res.json({ status: "SUCCESS", customers });
});

// get single Customer
const getSingleCustomer = asyncWrapper(async (req, res) => {
  const customer = await Customer.findById(req.params.customerID)
    .select("-__v")
    .populate("orders.order")
    .populate({
      path: "orders.order",
      populate: {
        path: "products.product",
      },
    });
  if (!customer) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Customer not found" });
  }
  res.json({ status: "SUCCESS", customer });
});

// delete custoner
const deleteCustomer = asyncWrapper(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.customerID);
  if (!customer) {
    return res
      .status(404)
      .json({ status: "ERROR", message: "Customer not found" });
  }
  res.json({ status: "SUCCESS", message: "Customer deleted successfully" });
});
module.exports = {
  createCustomer,
  createCustomerByOrder,
  getAllCustomer,
  deleteCustomer,
  getSingleCustomer
};
