# 🏥 SANVYA HEALTH — APIE (Autonomous Patient Insight Engine)

> Full Stack Application — Node.js Backend + Next.js Frontend

---

## 📁 Project Structure

```
sanva/
├── backend/      ← Node.js + Express + MongoDB API
├── frontend/     ← Next.js + Tailwind CSS
└── README.md     ← You are here
```

---

## ⚠️ Don't Panic If You See This Screen!

If you open `http://localhost:3000` and see this:

```
┌─────────────────────────────────────┐
│         🔗                          │
│   Invalid or Expired Link           │
│   This health report link is        │
│   either invalid, expired, or has   │
│   already been used.                │
└─────────────────────────────────────┘
```

**This is 100% normal and expected.** This page appears when you open the frontend
directly without a patient token in the URL. Patient report links look like:

```
http://localhost:3000/report?token=a3f9b2c1d4e5f6...
```

👉 **To get a valid link, follow the Quick Start steps below.**

---

## 🚀 Quick Start (Step by Step)

### Prerequisites
- Node.js v18+
- MongoDB running locally OR a MongoDB Atlas URI
- Google Gemini API Key (free at [aistudio.google.com](https://aistudio.google.com/apikey))

---

### Step 1 — Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Now open `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/apie_db
GEMINI_API_KEY=AIzaSy-your-key-here
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB connected
```

---

### Step 2 — Setup Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start at `http://localhost:3000`

---

### Step 3 — Seed Sample Data & Get Patient Links

Open a **third terminal**:

```bash
cd backend
node script/seedData.js
```

This will:
- Insert 4 sample patients from 2 different hospital formats
- Generate AI insights for each patient
- Print access links in the terminal

**Example output:**
```
🌱 Seeding hospital data...

Hospital A: 2 patients ingested
Hospital B: 2 patients ingested

⚙️  Processing all patients (generating insights + links)...
Results: [
  {
    "name": "Ramesh Kumar",
    "status": "processed",
    "accessLink": "http://localhost:3000/report?token=a3f9b2c1d4e5..."
  },
  {
    "name": "Sunita Devi",
    "status": "processed",
    "accessLink": "http://localhost:3000/report?token=b7c8d9e0f1..."
  },
  ...
]
```

---

### Step 4 — Open Patient Report

1. **Copy** any `accessLink` from the terminal output
2. **Paste** it into your browser
3. **Enter** the patient's phone number (see table below)
4. **Check** the backend terminal for the OTP (it's printed there since SMS is simulated)
5. **Enter** the OTP → view the full health report
6. **Download** the report (important — link works only once!)

---

## 📱 Sample Patient Phone Numbers

These are the phone numbers seeded in `backend/script/seedData.js`:

| Patient | Hospital | Phone Number |
|---|---|---|
| Ramesh Kumar | Apollo Hospital Delhi | `9876543210` |
| Sunita Devi | Apollo Hospital Delhi | `9123456789` |
| Mohammad Iqbal | City Medical Center | `8899001122` |
| Priya Sharma | City Medical Center | `7700112233` |

> 💡 **Customizing for demo?** Open `backend/script/seedData.js` and change
> the `mobile` / `ph_no` fields to your own phone number. Then re-run:
> ```bash
> node script/cleanDB.js   # clears old data
> node script/seedData.js  # re-seeds with your number
> ```

---

## 🔁 Full Patient Flow

```
1. Hospital sends data to POST /api/ingest
          ↓
2. System normalizes any format → unified schema
          ↓
3. POST /api/ingest/process → AI generates insights + access link
          ↓
4. Patient opens: localhost:3000/report?token=xxxxx
          ↓
5. Patient enters phone number → OTP generated (printed in terminal)
          ↓
6. Patient enters OTP → report unlocked
          ↓
7. Patient views + downloads report → link permanently disabled
```

---

## 🛠️ Useful Commands

```bash
# Backend
npm run dev                    # Start backend (auto-restart on changes)
npm start                      # Start backend (production)
node script/seedData.js        # Seed 4 sample patients
node script/cleanDB.js         # Clear all data from DB

# Frontend
npm run dev                    # Start frontend
npm run build                  # Build for production
```

---

## 🔗 URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Swagger API Docs | http://localhost:5000/api-docs |
| Health Check | http://localhost:5000/health |

---

## 📚 More Documentation

| File | Description |
|---|---|
| `backend/README.md` | Backend setup, API routes, DB models |
| `backend/ARCHITECTURE.md` | System design, LLM strategy, security |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Frontend | Next.js 14, Tailwind CSS |
| API Docs | Swagger UI |