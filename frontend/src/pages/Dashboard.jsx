import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, CloudSun, MessageCircleQuestion, TrendingUp, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Dashboard = () => {
  const { user } = useAuth();
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, chatRes] = await Promise.all([
          api.get("/diagnosis/history"),
          api.get("/chat/history"),
        ]);
        setDiagnosisHistory(diagRes.data.slice(0, 3));
        setChatHistory(chatRes.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickLinks = [
    {
      to: "/diagnosis",
      icon: ScanLine,
      title: "Crop Diagnosis",
      desc: "Upload a leaf photo to detect diseases with AI",
      color: "bg-primary-100 text-primary-700",
    },
    {
      to: "/weather",
      icon: CloudSun,
      title: "Weather Forecast",
      desc: "Check live weather and farming advisories",
      color: "bg-blue-100 text-blue-700",
    },
    {
      to: "/advisor",
      icon: MessageCircleQuestion,
      title: "Ask AI Advisor",
      desc: "Get instant farming advice from Gemini AI",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.farmName ? `${user.farmName} — ` : ""}
          Here's an overview of your smart farming assistant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {quickLinks.map(({ to, icon: Icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-primary-600" />
              Recent Diagnoses
            </h2>
            <Link to="/diagnosis" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : diagnosisHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No diagnoses yet. Upload a crop image to get started.</p>
          ) : (
            <ul className="space-y-3">
              {diagnosisHistory.map((d) => (
                <li key={d._id} className="flex items-center gap-3 text-sm">
                  <img
                    src={d.imagePath}
                    alt={d.cropName}
                    className="w-10 h-10 rounded-lg object-cover border"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{d.cropName} — {d.diseaseDetected}</p>
                    <p className="text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Recent Questions
            </h2>
            <Link to="/advisor" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : chatHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No questions asked yet. Try the AI advisor.</p>
          ) : (
            <ul className="space-y-3">
              {chatHistory.map((c) => (
                <li key={c._id} className="text-sm">
                  <p className="font-medium text-gray-800 truncate">{c.question}</p>
                  <p className="text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
