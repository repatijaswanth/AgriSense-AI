import { useState, useEffect } from "react";
import { Search, Droplets, Wind, Loader2, Info, MapPin } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Weather = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.location?.city || "");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async (searchCity) => {
    if (!searchCity) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/weather", { params: { city: searchCity } });
      setWeather(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch weather. Try another city name.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.location?.city) {
      fetchWeather(user.location.city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Weather Forecast</h1>
      <p className="text-gray-500 mb-6">Live weather data and farming advisories powered by OpenWeather</p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input-field pl-9"
            placeholder="     Enter city name (e.g. Anantapur)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-6">
          {error}
        </div>
      )}

      {weather && (
        <>
          <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">{weather.location}</p>
                <p className="text-4xl font-bold mt-1">{Math.round(weather.current.temp)}°C</p>
                <p className="text-primary-100 capitalize mt-1">{weather.current.description}</p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${weather.current.icon}@4x.png`}
                alt={weather.current.description}
                className="w-24 h-24"
              />
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-primary-500">
              <div className="flex items-center gap-1.5 text-sm">
                <Droplets className="w-4 h-4" />
                {weather.current.humidity}% Humidity
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Wind className="w-4 h-4" />
                {weather.current.windSpeed} m/s Wind
              </div>
            </div>
          </div>

          <div className="card mb-6 flex items-start gap-3 bg-amber-50 border-amber-200">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Farming Advisory</p>
              <p className="text-sm text-amber-700">{weather.advisory}</p>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 mb-4">5-Day Forecast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {weather.forecast.map((f) => (
              <div key={f.date} className="card text-center py-4">
                <p className="text-xs text-gray-500">
                  {new Date(f.date).toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <img
                  src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                  alt={f.description}
                  className="w-10 h-10 mx-auto"
                />
                <p className="font-semibold text-gray-900">{Math.round(f.temp)}°C</p>
                <p className="text-xs text-gray-400 capitalize">{f.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Weather;
