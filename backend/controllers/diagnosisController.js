const path = require("path");
const Diagnosis = require("../models/Diagnosis");
const { analyzeCropImage } = require("../utils/gemini");

// @desc    Upload crop image and get AI disease diagnosis
// @route   POST /api/diagnosis/analyze
// @access  Private
const analyzeCrop = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a crop image" });
    }

    const mimeType = req.file.mimetype;
    const imagePath = req.file.path;

    const { parsed, raw } = await analyzeCropImage(imagePath, mimeType);

    const diagnosis = await Diagnosis.create({
      user: req.user._id,
      imagePath: `/uploads/${req.file.filename}`,
      cropName: parsed.cropName || "Unknown",
      diseaseDetected: parsed.diseaseDetected || "",
      confidence: parsed.confidence || "",
      symptoms: parsed.symptoms || "",
      recommendations: parsed.recommendations || "",
      rawAIResponse: raw,
    });

    res.status(201).json(diagnosis);
  } catch (error) {
    console.error("Gemini analysis error:", error.message);
    res.status(500).json({
      message: "Failed to analyze crop image. Please check your Gemini API key and try again.",
      error: error.message,
    });
  }
};

// @desc    Get all diagnosis history for logged-in user
// @route   GET /api/diagnosis/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const history = await Diagnosis.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a diagnosis record
// @route   DELETE /api/diagnosis/:id
// @access  Private
const deleteDiagnosis = async (req, res, next) => {
  try {
    const record = await Diagnosis.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Diagnosis record not found" });
    }

    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this record" });
    }

    await record.deleteOne();
    res.json({ message: "Diagnosis record deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeCrop, getHistory, deleteDiagnosis };
