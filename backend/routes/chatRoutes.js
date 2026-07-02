const express = require("express");
const router = express.Router();
const {
  askQuestion,
  askQuestionVoice,
  speakText,
  getChatHistory,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/ask", protect, askQuestion);
router.post("/ask-voice", protect, upload.uploadAudio.single("audio"), askQuestionVoice);
router.post("/speak", protect, speakText);
router.get("/history", protect, getChatHistory);

module.exports = router;
