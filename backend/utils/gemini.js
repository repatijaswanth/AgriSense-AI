const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Text + multimodal (image/audio) understanding model
const MODEL = "gemini-2.5-flash";
// Dedicated text-to-speech model
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Supported languages for voice + text replies
const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
};

function languageName(code) {
  return LANGUAGE_NAMES[code] || LANGUAGE_NAMES.en;
}

/**
 * Analyze a crop image for disease detection using Gemini's multimodal model.
 * Returns a structured JSON object.
 */
async function analyzeCropImage(imagePath, mimeType) {
  const prompt = `You are an expert agricultural plant pathologist. Analyze the uploaded crop/plant leaf image and respond ONLY with strict JSON (no markdown, no backticks) in exactly this format:
{
  "cropName": "string - the likely crop/plant name",
  "diseaseDetected": "string - name of the disease, or 'Healthy' if no disease visible",
  "confidence": "string - e.g. 'High', 'Medium', 'Low'",
  "symptoms": "string - brief description of visible symptoms",
  "recommendations": "string - practical treatment and prevention advice for farmers"
}`;

  const base64Image = fs.readFileSync(imagePath).toString("base64");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    ],
  });

  const responseText = response.text;

  // Attempt to parse JSON safely, stripping potential markdown fences
  const cleaned = responseText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    parsed = {
      cropName: "Unknown",
      diseaseDetected: "Could not parse AI response",
      confidence: "Low",
      symptoms: "",
      recommendations: cleaned,
    };
  }

  return { parsed, raw: responseText };
}

/**
 * General farming Q&A chat using Gemini text model.
 * `language` is a code like "en" | "hi" | "te".
 */
async function askFarmingQuestion(question, contextInfo = "", language = "en") {
  const langName = languageName(language);
  const prompt = `You are an expert agricultural advisor helping a farmer in India. Answer clearly, practically, and concisely (max ~200 words). Use simple, everyday language a farmer with little formal education can understand. Avoid technical jargon; if you must use a technical term, briefly explain it in plain words.

Respond ONLY in ${langName}, regardless of what language the question was asked in.

${contextInfo ? `Context: ${contextInfo}\n` : ""}Farmer's question: ${question}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

/**
 * Takes a recorded audio question from a farmer, transcribes it, and answers it,
 * all in one Gemini call. Returns { transcript, answer }.
 */
async function askFarmingQuestionFromAudio(
  audioPath,
  mimeType,
  contextInfo = "",
  language = "en"
) {
  const langName = languageName(language);
  const prompt = `You are an expert agricultural advisor helping a farmer in India who has asked a question by voice (attached audio). The farmer may not be able to read or write well, so do not assume they can read English.

Steps:
1. Listen to the audio and transcribe exactly what the farmer said, in the original language they spoke.
2. Answer their farming question clearly, practically, and concisely (max ~200 words), using simple everyday language a farmer with little formal education can understand. Avoid technical jargon; briefly explain any term you must use.
3. Write your answer ONLY in ${langName}, regardless of what language the farmer spoke in.

${contextInfo ? `Context: ${contextInfo}\n` : ""}
Respond ONLY with strict JSON (no markdown, no backticks) in exactly this format:
{
  "transcript": "string - what the farmer said, transcribed in its original spoken language",
  "answer": "string - your answer, written in ${langName}"
}`;

  const base64Audio = fs.readFileSync(audioPath).toString("base64");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Audio } },
        ],
      },
    ],
  });

  const responseText = response.text;
  const cleaned = responseText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fall back to treating the whole response as the answer if parsing fails
    parsed = {
      transcript: "",
      answer: cleaned,
    };
  }

  return parsed;
}

/**
 * Wraps raw 16-bit PCM audio data (as returned by Gemini TTS) in a WAV header
 * so it can be played directly in the browser without extra dependencies.
 */
function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const blockAlign = (channels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Converts text into spoken audio using Gemini's TTS model.
 * Returns a base64-encoded WAV data URL string, ready to use in an <audio> tag.
 */
async function textToSpeech(text, language = "en") {
  const langName = languageName(language);
  // A short natural-language instruction helps Gemini's TTS pick a fitting
  // tone/pace; the TTS model auto-detects the actual spoken language from the text.
  const prompt = `Say the following in a warm, clear, friendly tone, suitable for a farmer listening on a phone. Speak in ${langName}.\n\n${text}`;

  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    },
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) {
    throw new Error("No audio returned from Gemini TTS");
  }

  const pcmBuffer = Buffer.from(inlineData.data, "base64");
  const wavBuffer = pcmToWav(pcmBuffer);

  return `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
}

module.exports = {
  askFarmingQuestion,
  askFarmingQuestionFromAudio,
  analyzeCropImage,
  textToSpeech,
  LANGUAGE_NAMES,
};
