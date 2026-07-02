const fs = require("fs");
const ChatQuery = require("../models/ChatQuery");
const {
  askFarmingQuestion,
  askFarmingQuestionFromAudio,
  textToSpeech,
  LANGUAGE_NAMES,
} = require("../utils/gemini");

const VALID_LANGUAGES = Object.keys(LANGUAGE_NAMES);

const normalizeLanguage = (language) =>
  VALID_LANGUAGES.includes(language) ? language : "en";

const buildContext = (req) =>
  req.user.location?.city ? `Farmer is located in ${req.user.location.city}.` : "";

// @desc    Ask the AI a farming-related question (typed text)
// @route   POST /api/chat/ask
// @access  Private
const askQuestion = async (req, res, next) => {
  try {
    const { question, language } = req.body;
    const lang = normalizeLanguage(language);

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Please provide a question" });
    }

    const contextInfo = buildContext(req);
    const answer = await askFarmingQuestion(question, contextInfo, lang);

    const chat = await ChatQuery.create({
      user: req.user._id,
      question,
      answer,
      language: lang,
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error("Gemini chat error:", error.message);
    res.status(500).json({
      message: "Failed to get AI response. Please check your Gemini API key and try again.",
      error: error.message,
    });
  }
};

// @desc    Ask the AI a farming-related question via a recorded voice message.
//          Transcribes the audio, answers it, and returns spoken audio too.
// @route   POST /api/chat/ask-voice
// @access  Private
const askQuestionVoice = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please provide an audio recording" });
    }

    const lang = normalizeLanguage(req.body.language);
    const contextInfo = buildContext(req);

    const { transcript, answer } = await askFarmingQuestionFromAudio(
      req.file.path,
      req.file.mimetype,
      contextInfo,
      lang
    );

    if (!answer) {
      throw new Error("Gemini did not return an answer for the recording");
    }

    const chat = await ChatQuery.create({
      user: req.user._id,
      question: transcript || "(voice message)",
      answer,
      language: lang,
    });

    // Best-effort: also generate spoken audio for the answer. If TTS fails,
    // still return the text so the farmer isn't left with nothing.
    let audio = null;
    try {
      audio = await textToSpeech(answer, lang);
    } catch (ttsError) {
      console.error("Gemini TTS error:", ttsError.message);
    }

    res.status(201).json({ ...chat.toObject(), audio });
  } catch (error) {
    console.error("Gemini voice chat error:", error.message);
    res.status(500).json({
      message: "Failed to process your voice question. Please try again.",
      error: error.message,
    });
  } finally {
    // Clean up the temporary recording regardless of outcome
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
};

// @desc    Convert a piece of text (e.g. an existing AI answer) into speech
// @route   POST /api/chat/speak
// @access  Private
const speakText = async (req, res, next) => {
  try {
    const { text, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Please provide text to speak" });
    }

    const lang = normalizeLanguage(language);
    const audio = await textToSpeech(text, lang);
    res.json({ audio });
  } catch (error) {
    console.error("Gemini TTS error:", error.message);
    res.status(500).json({
      message: "Failed to generate audio. Please try again.",
      error: error.message,
    });
  }
};

// @desc    Get chat history for logged-in user
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const history = await ChatQuery.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = { askQuestion, askQuestionVoice, speakText, getChatHistory };
