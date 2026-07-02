const mongoose = require("mongoose");

const chatQuerySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["en", "hi", "te"],
      default: "en",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatQuery", chatQuerySchema);
