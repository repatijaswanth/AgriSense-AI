# 🌾 AgriSense AI-Smart Agriculture Assistant

A full-stack MERN application that helps farmers with AI-powered crop disease diagnosis, live weather forecasts and farming advisories, and an AI chat advisor — all powered by Google's Gemini API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini API (free tier) |
| Authentication | JWT (JSON Web Tokens) |
| Image Upload | Multer |
| Weather | OpenWeather API |

## Features

- 🔐 **User Authentication** — Register/login with JWT, bcrypt-hashed passwords, protected routes
- 🌿 **AI Crop Disease Diagnosis** — Upload a leaf/crop photo; Gemini's vision model identifies the crop, detects disease, and gives treatment recommendations
- ☁️ **Weather Dashboard** — Live weather + 5-day forecast by city, with automatic farming advisories (e.g. "high humidity — watch for fungal disease")
- 🤖 **AI Farming Advisor Chat** — Ask any farming question and get concise, practical advice from Gemini
- 📜 **History Tracking** — Every diagnosis and chat question is saved to MongoDB per user
- 👤 **Profile Management** — Update name, farm name, city, and password

## Project Structure

```
smart-agri-assistant/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # Route logic (auth, diagnosis, weather, chat)
│   ├── middleware/                # JWT auth, error handling, Multer upload
│   ├── models/                    # Mongoose schemas: User, Diagnosis, ChatQuery
│   ├── routes/                    # Express routers
│   ├── utils/gemini.js           # Gemini API wrapper (vision + text)
│   ├── uploads/                   # Uploaded crop images (served statically)
│   ├── server.js                  # App entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/            # Navbar, ProtectedRoute
    │   ├── pages/                 # Login, Register, Dashboard, CropDiagnosis, Weather, Advisor, Profile
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account and cluster
- A free [Gemini API key](https://aistudio.google.com/app/apikey) from Google AI Studio
- A free [OpenWeather API key](https://home.openweathermap.org/users/sign_up)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your real values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/smart_agri_db?retryWrites=true&w=majority
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API will run at `http://localhost:5000`. Test it: `GET http://localhost:5000/api/health`

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` already points to `http://localhost:5000/api`, which matches the backend above.

Start the frontend:

```bash
npm run dev
```

The app will run at `http://localhost:5173`.

### 3. Try it out

1. Open `http://localhost:5173` → you'll be redirected to `/login`
2. Click **Register here** to create an account (add your city so weather works automatically)
3. Explore:
   - **Crop Diagnosis** — upload a leaf photo, click "Analyze Crop Image"
   - **Weather** — see live conditions + 5-day forecast + advisory
   - **Ask AI** — chat with the Gemini-powered farming advisor

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/profile` | Get profile | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| POST | `/api/diagnosis/analyze` | Upload image, get AI diagnosis | Private |
| GET | `/api/diagnosis/history` | Get diagnosis history | Private |
| DELETE | `/api/diagnosis/:id` | Delete a diagnosis record | Private |
| GET | `/api/weather?city=` | Get weather + forecast + advisory | Private |
| POST | `/api/chat/ask` | Ask the AI a farming question | Private |
| GET | `/api/chat/history` | Get chat history | Private |

## Notes & Tips

- **Gemini free tier** has rate limits (requests per minute/day). If diagnosis or chat calls fail with a quota error, wait a bit and retry, or check your usage at [Google AI Studio](https://aistudio.google.com).
- **Image size**: uploads are capped at 5MB (jpeg/jpg/png/webp only) — adjust in `backend/middleware/uploadMiddleware.js` if needed.
- **CORS**: the backend only allows requests from `CLIENT_URL` in `.env` — update this if you deploy the frontend elsewhere.
- **Production deploy**: for a real deployment, swap local disk storage (Multer) for a cloud bucket (e.g. Cloudinary/S3), since local `uploads/` won't persist on most hosting platforms.
- This project uses `gemini-1.5-flash` (fast + free-tier friendly). You can switch to `gemini-1.5-pro` in `backend/utils/gemini.js` for higher accuracy at lower free-tier limits.

## License

MIT — free to use and modify for learning or your own projects.
