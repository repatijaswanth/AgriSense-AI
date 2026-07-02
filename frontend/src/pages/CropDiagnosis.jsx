import { useState, useEffect, useRef } from "react";
import { Upload, Loader2, Leaf, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

const CropDiagnosis = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/diagnosis/history");
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/diagnosis/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/diagnosis/${id}`);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const isHealthy = (d) => d?.diseaseDetected?.toLowerCase() === "healthy";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Crop Disease Diagnosis</h1>
      <p className="text-gray-500 mb-6">Upload a photo of a crop or leaf to detect diseases using Gemini AI</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card">
          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-56 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-10 h-10" />
                <p className="text-sm">Click to upload a crop/leaf image</p>
                <p className="text-xs">JPEG, PNG, WEBP (max 5MB)</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mt-4">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
            {loading ? "Analyzing with AI..." : "Analyze Crop Image"}
          </button>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Diagnosis Result</h2>
          {!result ? (
            <p className="text-sm text-gray-400">Upload and analyze an image to see AI results here.</p>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isHealthy(result) ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}>
                {isHealthy(result) ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {result.diseaseDetected} {result.confidence && `(${result.confidence} confidence)`}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-medium">Crop</p>
                <p className="text-sm text-gray-800">{result.cropName}</p>
              </div>
              {result.symptoms && (
                <div>
                  <p className="text-xs uppercase text-gray-400 font-medium">Symptoms</p>
                  <p className="text-sm text-gray-800">{result.symptoms}</p>
                </div>
              )}
              {result.recommendations && (
                <div>
                  <p className="text-xs uppercase text-gray-400 font-medium">Recommendations</p>
                  <p className="text-sm text-gray-800">{result.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Diagnosis History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No diagnosis history yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((d) => (
              <div key={d._id} className="card">
                <img src={d.imagePath} alt={d.cropName} className="w-full h-32 object-cover rounded-lg mb-3" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{d.cropName}</p>
                    <p className={`text-xs ${isHealthy(d) ? "text-green-600" : "text-amber-600"}`}>
                      {d.diseaseDetected}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDelete(d._id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDiagnosis;
