const asyncWrapper = require("../middleware/asyncWrapper");
const User = require("../models/user.model");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const createUser = asyncWrapper(async (req, res) => {
  const { fullName, email, password, roles } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "ERROR", errors: errors.array() });
  }

  const createData = { ...req.body };

  if (req.file) {
    createData.image = req.file.path;
  }

  const user = await User.findOne({ email: email });
  if (user) {
    return res
      .status(400)
      .json({ status: "ERORR", message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  createData.password = hashedPassword;
  const newUser = new User(createData);
  await newUser.save();
  res
    .status(201)
    .json({ status: "SUCCESS", message: "User created successfully" });
});

// get all users
const getUsers = asyncWrapper(async (req, res) => {
  const users = await User.find({}).select("-__v");
  res.json({ status: "SUCCESS", count: users.length, users: users });
});

// delete User
const deleteUser = asyncWrapper(async (req, res) => {
  const { userID } = req.params;

  const user = await User.findByIdAndDelete(userID);

  if (!user) {
    return res.status(404).json({ status: "ERROR", message: "User not found" });
  }

  res.json({ status: "SUCCESS", message: "User deleted successfully" });
});

// Login
const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  // check if email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  const user = await User.findOne({ email: email });
  // check if user exists
  if (!user) {
    return res
      .status(401)
      .json({ status: "ERORR", message: "Email is not found" });
  }

  // check if password is correct
  const isMatchPass = await bcrypt.compare(password, user.password);
  if (!isMatchPass) {
    return res
      .status(401)
      .json({ status: "ERORR", message: "Password is incorrect" });
  }

  // generate JWT token
  const token = jwt.sign(
    { email: user.email, id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  // send token to coockies
  // res.cookie("token", token, {
  //   httpOnly: false,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: process.env.NODE_ENV === "production",
  //   none: "strict",
  //   sameSite: "Lax",
  //   path: "/",
  // });
  res.cookie("token", token, {
    httpOnly: true, // يحمي الكوكيز من الوصول إليها عبر JavaScript
    secure: process.env.NODE_ENV === "production", // يعمل فقط على HTTPS في production
    sameSite: "lax", // استخدم "none" إذا كنت تعمل مع دومينات مختلفة وتستخدم HTTPS
  });

  res.json({ status: "SUCCESS", message: "Login successful", token: token });
});

// Logout
const logout = asyncWrapper(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ status: "SUCCESS", message: "Logged out successfully" });
});

// change Password
const changePassword = asyncWrapper(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Old password is required" });
  }
  if (!newPassword) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "New password is required" });
  }
  const user = req.user;

  const findUser = await User.findById(user.id);
  // check if old password is correct
  const isMatchPass = await bcrypt.compare(oldPassword, findUser.password);
  if (!isMatchPass) {
    return res
      .status(401)
      .json({ status: "ERORR", message: "Old password is incorrect" });
  }
  // hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  findUser.password = hashedPassword;
  await findUser.save();
  res.json({ status: "SUCCESS", message: "Password changed successfully" });
});

// get user by token
const getProfile = asyncWrapper(async (req, res) => {
  const user = req.user;
  const findUser = await User.findById(user.id);

  if (!findUser) {
    return res.status(404).json({ status: "ERROR", message: "User not found" });
  }

  res.json({ status: "SUCCESS", user: findUser });
});

const updateProfile = asyncWrapper(async (req, res) => {
  const user = req.user;
  const newData = req.body;

  if (req.file) {
    newData.image = req.file.path;
  }
  const findUser = await User.findByIdAndUpdate(user.id, newData, {
    new: true,
  });
  if (!findUser) {
    return res.status(404).json({ status: "ERROR", message: "User not found" });
  }
  res.json({ status: "SUCCESS", user: findUser });
});

module.exports = {
  createUser,
  getUsers,
  deleteUser,
  login,
  logout,
  changePassword,
  getProfile,
  updateProfile,
};
