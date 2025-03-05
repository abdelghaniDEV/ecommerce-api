const mongoose = require("mongoose");

const orderShema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  country : { type: String, required: true},
  city : { type: String, required: true},
  zipCode : { type: String, required: true},

  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      size: {type: String, required: false},
      color: {type: String, required: false},
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    },
  ],
  totalItems : { type: Number, required: true},
  totalPrice: { type: Number, required: true },
  status: { type: String, required: true, default : "pending" , enum: ["pending", "processing", "shipped", "delivered", "cancelled"] },
  createdAt: { type: Date, default: Date.now },
});



module.exports = mongoose.model("Order", orderShema);


