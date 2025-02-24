const mongoose = require("mongoose");

const ratingShema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  comment: { type: String, required: false },
  rating: { type: Number, required: true },
  image: { type: String, required: false },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Rating", ratingShema);
