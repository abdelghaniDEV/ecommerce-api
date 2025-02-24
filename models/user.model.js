const mongoose = require("mongoose");

const userShema = new mongoose.Schema({
  email: { type: "string", required: true },
  password: { type: "string", required: true },
  image : { type: "string", required: false} ,
  role: { type: "string", enum: ["admin", "employee"] , default : 'employee' },
  fullName: { type: "string", required: true },
});

module.exports = mongoose.model("User", userShema);
