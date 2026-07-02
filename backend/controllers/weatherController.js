const axios = require("axios");

// @desc    Get current weather + forecast by city name or lat/lon
// @route   GET /api/weather?city=CityName  OR  /api/weather?lat=..&lon=..
// @access  Private
const getWeather = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!city && !(lat && lon)) {
      return res.status(400).json({ message: "Please provide a city name or lat/lon coordinates" });
    }

    const params = {
      appid: apiKey,
      units: "metric",
    };
    if (city) params.q = city;
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    }

    // Current weather
    const currentRes = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      { params }
    );

    // 5 day / 3 hour forecast
    const forecastRes = await axios.get(
      "https://api.openweathermap.org/data/2.5/forecast",
      { params }
    );

    const current = currentRes.data;
    const forecastList = forecastRes.data.list || [];

    // Reduce forecast to one entry per day (next 5 days, midday reading)
    const dailyForecast = forecastList
      .filter((entry) => entry.dt_txt.includes("12:00:00"))
      .slice(0, 5)
      .map((entry) => ({
        date: entry.dt_txt.split(" ")[0],
        temp: entry.main.temp,
        humidity: entry.main.humidity,
        description: entry.weather[0].description,
        icon: entry.weather[0].icon,
        windSpeed: entry.wind.speed,
      }));

    // Simple farming advisory based on conditions
    let advisory = "Conditions look normal for regular farm activities.";
    if (current.main.humidity > 80) {
      advisory = "High humidity detected — monitor crops for fungal diseases.";
    } else if (current.wind.speed > 10) {
      advisory = "Strong winds expected — secure young plants and greenhouse structures.";
    } else if (current.weather[0].main.toLowerCase().includes("rain")) {
      advisory = "Rain expected — consider delaying irrigation and pesticide spraying.";
    } else if (current.main.temp > 35) {
      advisory = "High temperature — ensure adequate irrigation to prevent heat stress.";
    }

    res.json({
      location: current.name,
      current: {
        temp: current.main.temp,
        feelsLike: current.main.feels_like,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
      },
      forecast: dailyForecast,
      advisory,
    });
  } catch (error) {
    console.error("Weather API error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch weather data. Check the city name or your API key.",
    });
  }
};

module.exports = { getWeather };
