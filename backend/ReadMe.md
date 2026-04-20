# 🏥 APIE — Autonomous Patient Insight Engine

APIE is an intelligent backend system that accepts patient data from **any hospital format**, normalizes it into a unified schema, generates **AI-powered health insights** using Google Gemini, and provides **secure OTP-based access** to patient reports.

---

## 🚀 Features

- **Dynamic Schema Normalization** — Accepts any hospital's data format (different field names, nested structures, etc.) and maps it to a single internal schema automatically
- **AI Insight Generation** — Uses Google Gemini to generate personalized health summaries, risk scores, weekly recommendations, dietary & exercise advice
- **Rule-Based Risk Scoring** — Deterministic risk scoring (0–100) based on age, diagnoses, vitals, and medications — runs even if AI fails
- **Secure OTP Access** — Patients access their reports via a unique link + OTP verification (no login required)
- **Swagger API Docs** — Full interactive API documentation at `/api-docs`
- **Rate Limiting** — Protection against abuse on all routes
- **Graceful Fallback** — If Gemini fails, rule-based insights are used automatically

---

## 📁 Project Structure

```
backend/
│
├── config/
│   ├── db.js               # MongoDB connection setup
│   ├── llm.js              # Google Gemini API integration
│   └── swagger.js          # Swagger/OpenAPI documentation config
│
├── controllers/
│   ├── ingestController.js # Handles patient data ingestion & processing
│   └── reportController.js # Handles OTP request & report retrieval
│
├── middlewares/
│   ├── errorHandler.js     # Global error handler
│   └── rateLimiter.js      # API rate limiting (general, OTP, ingest)
│
├── models/
│   ├── Patient.js          # Unified patient schema (MongoDB)
│   ├── PatientInsight.js   # AI-generated insight schema (MongoDB)
│   └── AccessToken.js      # OTP + access token schema (MongoDB)
│
├── routes/
│   ├── ingestRoutes.js     # POST /api/ingest, POST /api/ingest/process
│   └── reportRoutes.js     # POST /api/report/request-otp, POST /api/report/verify
│
├── services/
│   ├── normalizerService.js   # Dynamic field mapping & schema normalization
│   ├── insightService.js      # AI insight generation + rule-based risk scoring
│   ├── accessTokenService.js  # Token generation, OTP creation & verification
│   └── otpService.js          # (Reserved for SMS/Email OTP delivery)
│
├── script/
│   ├── seedData.js         # Seeds sample patients from 2 different hospital formats
│   └── cleanDB.js          # Clears all APIE collections from the database
│
├── server.js               # Express app entry point
├── package.json
├── .env.example            # Environment variable template
└── .gitignore
```

---

## ⚙️ How It Works

### 1. Data Ingestion (`/api/ingest`)
Hospitals send patient data in **any format** — different field names, nested objects, arrays, strings. The `normalizerService` automatically:
- Flattens nested objects
- Matches unknown field names using a **synonym dictionary** (50+ aliases)
- Uses **Levenshtein distance** for fuzzy matching of unrecognized fields
- Normalizes values (gender strings, date formats, arrays vs comma-separated strings)
- Auto-calculates BMI if height and weight are present

### 2. Processing (`/api/ingest/process`)
For each unprocessed patient:
1. **Rule-based risk scoring** — Calculates a 0–100 risk score from age, diagnoses, vitals
2. **Gemini AI** — Generates a full insight report in structured JSON
3. **Validation** — Checks AI response has all required fields
4. **Fallback** — If AI fails, uses rule-based data only
5. **Access token** — Generates a unique 7-day access link for the patient

### 3. Patient Report Access
- Patient receives a unique link: `http://yourfrontend.com/report?token=xxxx`
- Patient requests OTP → OTP is generated (sent via SMS/Email in production)
- Patient submits OTP → Gets full health insight report

---

## 🗄️ Database Models

### `Patient`
Stores normalized patient data from any hospital format.

| Field | Type | Description |
|---|---|---|
| `patientId` | String | Unique patient ID (from hospital) |
| `name` | String | Full name |
| `age` | Number | Age in years |
| `gender` | String | male / female / other / unknown |
| `phone` | String | Contact number |
| `email` | String | Email address |
| `bloodGroup` | String | ABO blood group |
| `diagnoses` | [String] | List of diagnoses |
| `medications` | [String] | Current medications |
| `allergies` | [String] | Known allergies |
| `vitals` | Object | BP, HR, Temp, Weight, Height, BMI, Sugar, SpO2 |
| `sourceHospital` | String | Which hospital sent the data |
| `insightGenerated` | Boolean | Whether AI insight has been generated |

### `PatientInsight`
Stores the AI-generated health report for each patient.

| Field | Type | Description |
|---|---|---|
| `summary` | String | 2-3 sentence clinical summary |
| `healthRiskIndicator` | Object | level, score (0-100), factors |
| `weeklyRecommendations` | [Object] | Day-wise health recommendations |
| `generalRecommendations` | [String] | General health tips |
| `dietaryAdvice` | String | Diet guidance |
| `exerciseAdvice` | String | Exercise guidance |
| `medicationReminders` | [String] | Medication reminders |
| `warningFlags` | [String] | Critical health warnings |

### `AccessToken`
Manages secure patient access via tokens and OTP.

| Field | Type | Description |
|---|---|---|
| `token` | String | Unique 64-char hex token |
| `patientId` | ObjectId | Reference to Patient |
| `expiresAt` | Date | Token expiry (7 days) |
| `otp` | String | 6-digit OTP |
| `otpExpiresAt` | Date | OTP expiry (10 minutes) |
| `otpVerified` | Boolean | Whether OTP was verified |
| `otpAttempts` | Number | Failed OTP attempts (max 5) |

---

## 🛣️ API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ingest` | Ingest raw patient data from any hospital |
| `POST` | `/api/ingest/process` | Generate AI insights + access tokens for all unprocessed patients |
| `POST` | `/api/report/request-otp` | Request OTP for report access |
| `POST` | `/api/report/verify` | Verify OTP and get full patient insight report |
| `GET` | `/health` | Server health check |
| `GET` | `/api-docs` | Swagger interactive API documentation |

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API Key (free at [aistudio.google.com](https://aistudio.google.com/apikey))

### Steps

**1. Clone and install:**
```bash
cd backend
npm install
```

**2. Setup environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/apie_db
GEMINI_API_KEY=AIzaSy-xxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

**3. Start server:**
```bash
npm run dev
```

**4. Seed sample data:**
```bash
node script/seedData.js
```

**5. Open Swagger docs:**
```
http://localhost:5000/api-docs
```

---

## 🌱 Sample Data

The seed script (`script/seedData.js`) sends data from **2 hospitals with completely different formats**:

**Hospital A (Apollo Delhi)** — uses fields like `patient_id`, `full_name`, `sex`, `conditions`, `medicines`, `bp_reading`

**Hospital B (City Medical Center)** — uses fields like `uhid`, `name`, `years`, `gender`, `presenting_complaints`, `prescription`, nested `vitals` object

Both are automatically normalized to the same internal schema. ✅

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| API Docs | Swagger UI + swagger-jsdoc |
| Rate Limiting | express-rate-limit |
| Dev Server | nodemon |

---

## 🔐 Security Features

- OTP expires in **10 minutes**
- Max **5 OTP attempts** before lockout
- Access token expires in **7 days**
- TTL index on `AccessToken` for automatic MongoDB cleanup
- Rate limiting on all routes
- Environment variables for all secrets

---

## 📋 Scripts

```bash
npm run dev        # Start dev server with nodemon (auto-restart)
npm start          # Start production server

node script/seedData.js   # Seed sample hospital data
node script/cleanDB.js    # Clear all APIE collections
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open Pull Request