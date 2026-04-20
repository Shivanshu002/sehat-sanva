# SANVYA HEALTH — APIE Full Stack Project

Autonomous Patient Insight Engine — Full Stack Application

## Project Structure
sanva/
├── backend/    ← Node.js + Express + MongoDB API
└── frontend/   ← Next.js + Tailwind CSS
## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI and GEMINI_API_KEY in .env
npm run dev
```

### 2. Seed Data

```bash
cd backend
node script/seedData.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open Browser

Frontend : http://localhost:3000
API Docs : http://localhost:5000/api-docs
Health   : http://localhost:5000/health

## Test Flow

1. Run seed script → copy any `accessLink` from output
2. Open the link in browser
3. Enter patient's phone number (from seed data)
4. Check backend terminal for OTP
5. Enter OTP → view full health report
6. Download report

## Sample Phone Numbers (from seed data)

| Patient | Phone |
|---|---|
| Ramesh Kumar | 9876543xxx |
| Sunita Devi | 9123xxx789 |
| Mohammad Iqbal | 889xxxx2 |
| Priya Sharma | 7700xxx233 |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Frontend | Next.js 14, Tailwind CSS |
| API Docs | Swagger UI |