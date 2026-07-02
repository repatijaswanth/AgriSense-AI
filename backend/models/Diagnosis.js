const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    cropName: {
      type: String,
      default: "Unknown",
    },
    diseaseDetected: {
      type: String,
      default: "",
    },
    confidence: {
      type: String,
      default: "",
    },
    symptoms: {
      type: String,
      default: "",
    },
    recommendations: {
      type: String,
      default: "",
    },
    rawAIResponse: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
