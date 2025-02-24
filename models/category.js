const mongoose = require("mongoose");

const categoryShema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  image: { type: String, required: false },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Category", categoryShema);
