const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ status: "ERORR", message: "Unauthorized" });


  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('user' , req.user);
    next();
  } catch (err) {
    res.status(403).json({ status: "ERORR", message: "Token is not valid" });
  }
};

const authorize = (roles) => async (req, res , next) => {
  const user = req.user;
  const findUser = await User.findById(user.id);
  if (!findUser) return res.status(401).json({ status: "ERORR", message: "Unauthorized" });
  if (!roles.includes(findUser.role)) {
    return res
     .status(403)
     .json({ status: "ERORR", message: "You are not authorized to perform this action" });
  }
  next();

} 

module.exports = {
  authenticate,
  authorize,
};
