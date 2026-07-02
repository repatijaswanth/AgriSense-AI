const express = require("express");
const router = express.Router();
const {
  analyzeCrop,
  getHistory,
  deleteDiagnosis,
} = require("../controllers/diagnosisController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/analyze", protect, upload.single("image"), analyzeCrop);
router.get("/history", protect, getHistory);
router.delete("/:id", protect, deleteDiagnosis);

module.exports = router;
