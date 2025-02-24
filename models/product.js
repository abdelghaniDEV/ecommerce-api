const mongoose = require("mongoose");

const productShema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  details: { type: String, required: false },
  price: { type: Number, required: true },
  size: { type: [String], required: false },
  color: { type: [String], required: false },
  images: { type: [String], required: false },
  ShortDescription: { type: String, required: false },
  stock: { type: Number, required: false, default: 0 },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productShema);
