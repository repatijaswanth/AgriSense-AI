import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  Mic,
  Square,
  Volume2,
  Languages,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
];

const Advisor = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/chat/history");
      const ordered = [...data].reverse();
      const flat = ordered.flatMap((c) => [
        { role: "user", text: c.question },
        { role: "ai", text: c.answer, language: c.language || "en" },
      ]);
      setMessages(flat);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Typed text question ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/chat/ask", {
        question: currentQuestion,
        language,
      });
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer, language: data.language || language },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get AI response.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Voice question (record -> send to Gemini -> get text + audio back) ----
  const playAudioDataUrl = (dataUrl) => {
    if (!dataUrl) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audioEl = new Audio(dataUrl);
    audioPlayerRef.current = audioEl;
    audioEl.play().catch((err) => console.error("Audio playback failed:", err));
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        sendVoiceQuestion(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError(
        "Couldn't access your microphone. Please check permissions and try again."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendVoiceQuestion = async (blob) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      const ext = blob.type.includes("webm") ? "webm" : "wav";
      formData.append("audio", blob, `question.${ext}`);
      formData.append("language", language);

      const { data } = await api.post("/chat/ask-voice", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", text: data.question || "(voice message)" },
        {
          role: "ai",
          text: data.answer,
          language: data.language || language,
          audio: data.audio,
        },
      ]);

      // Voice questions get spoken answers automatically
      if (data.audio) {
        playAudioDataUrl(data.audio);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to process your voice question."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- Speak an existing AI text answer on demand ----
  const handleSpeak = async (msg, index) => {
    if (msg.audio) {
      playAudioDataUrl(msg.audio);
      return;
    }
    setSpeakingIndex(index);
    try {
      const { data } = await api.post("/chat/speak", {
        text: msg.text,
        language: msg.language || language,
      });
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, audio: data.audio } : m))
      );
      playAudioDataUrl(data.audio);
    } catch (err) {
      console.error(err);
      setError("Couldn't generate audio for this answer.");
    } finally {
      setSpeakingIndex(null);
    }
  };

  const suggestedQuestions = [
    "When is the best time to plant tomatoes?",
    "How do I improve soil fertility naturally?",
    "What causes yellowing leaves in rice crops?",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ask AI Advisor</h1>
          <p className="text-gray-500">
            Get instant farming advice powered by Gemini AI — type or just speak
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field py-1.5 text-sm w-auto"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto card mb-4 space-y-4 mt-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <Bot className="w-10 h-10 text-primary-400 mb-3" />
            <p className="text-gray-500 mb-4">
              Ask me anything about crops, soil, pests, or farming practices — by
              typing or tapping the mic to speak
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="btn-secondary text-sm text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-primary-700"
                }`}
              >
                {m.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`rounded-xl px-4 py-2.5 max-w-[80%] text-sm flex items-start gap-2 ${
                  m.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <span>{m.text}</span>
                {m.role === "ai" && (
                  <button
                    onClick={() => handleSpeak(m, i)}
                    disabled={speakingIndex === i}
                    title="Listen to this answer"
                    className="shrink-0 text-gray-500 hover:text-primary-700 disabled:opacity-50"
                  >
                    {speakingIndex === i ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-primary-700">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-xl px-4 py-2.5 bg-gray-100 text-gray-400 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input-field"
          placeholder="Type your farming question, or tap the mic to speak..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isRecording}
        />
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          title={isRecording ? "Stop recording" : "Ask by voice"}
          className={`shrink-0 rounded-lg px-3.5 flex items-center justify-center transition-colors ${
            isRecording
              ? "bg-red-600 text-white animate-pulse"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={loading || !question.trim() || isRecording}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default Advisor;
