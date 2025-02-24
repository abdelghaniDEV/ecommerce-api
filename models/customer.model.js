const mongoose = require("mongoose");

const customerShema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  orders: [
    {
      order: { type: mongoose.Types.ObjectId, ref: "Order" },
    },
  ],
  totalItems : {type : Number , required: true , default: 0},
  totalOrders : {type : Number , required: true , default : 0},
  totalAmount : {type : Number , required: true , default: 0},
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

module.exports = mongoose.model("Customer", customerShema);
