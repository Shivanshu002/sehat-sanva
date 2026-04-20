# APIE — Architecture & Technical Design Document

> Autonomous Patient Insight Engine — Backend Architecture

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [How the System Handles Different Data Formats](#2-how-the-system-handles-different-data-formats)
3. [Conversion Layer Design](#3-conversion-layer-design)
4. [LLM Prompt Strategy](#4-llm-prompt-strategy)
5. [Security Implementation](#5-security-implementation)
6. [API Design](#6-api-design)
7. [Limitations](#7-limitations)

---

## 1. System Overview

APIE is a plug-in intelligence layer that sits between any hospital management system
and the patient. It accepts raw patient data in **any format**, normalizes it,
generates AI-powered health insights, and delivers them securely via a one-time
access link + OTP system.

```
Hospital A (any format)  ──┐
Hospital B (any format)  ──┼──▶  Normalizer  ──▶  Insight Engine  ──▶  Secure Link  ──▶  Patient
Hospital C (any format)  ──┘
```

### Backend Folder Structure

```
backend/
├── config/
│   ├── db.js                  # MongoDB connection
│   ├── llm.js                 # Google Gemini API wrapper
│   └── swagger.js             # Swagger/OpenAPI docs config
│
├── controllers/
│   ├── ingestController.js    # Handles data ingestion + processing
│   └── reportController.js   # Handles OTP request + report retrieval
│
├── middlewares/
│   ├── errorHandler.js        # Global error handler
│   └── rateLimiter.js         # Rate limiting (OTP, ingest, general)
│
├── models/
│   ├── Patient.js             # Unified patient schema
│   ├── PatientInsight.js      # AI-generated insight schema
│   └── AccessToken.js         # OTP + single-use token schema
│
├── routes/
│   ├── ingestRoutes.js        # POST /api/ingest, /api/ingest/process
│   └── reportRoutes.js        # POST /api/report/request-otp, /verify
│
├── services/
│   ├── normalizerService.js   # ⭐ Dynamic field mapping engine
│   ├── insightService.js      # ⭐ Rule-based + LLM insight generation
│   ├── accessTokenService.js  # Token + OTP management
│   └── otpService.js          # (Reserved for SMS/Email delivery)
│
├── script/
│   ├── seedData.js            # Seeds 2 hospital formats for testing
│   └── cleanDB.js             # Clears all APIE collections
│
└── server.js                  # Express app entry point
```

---

## 2. How the System Handles Different Data Formats

### The Core Challenge

Hospital A might send:
```json
{
  "patient_id": "APL-001",
  "full_name": "Ramesh Kumar",
  "sex": "M",
  "bp_reading": "148/92",
  "fbs": 210
}
```

Hospital B might send:
```json
{
  "uhid": "CMC-101",
  "name": "Mohammad Iqbal",
  "gender": "male",
  "vitals": {
    "systolic_diastolic": "162/98",
    "blood_glucose": 145
  }
}
```

Both must produce the same internal schema. **Zero hardcoded logic per hospital.**

### Solution: Dynamic Normalization Engine (`normalizerService.js`)

**Step 1 — Flatten Nested Objects**

All incoming data is first flattened into a single-level key-value map:

```
{ "vitals.systolic_diastolic": "162/98", "vitals.blood_glucose": 145 }
```

This means nested fields are accessible at the same level as flat fields for matching.

**Step 2 — Synonym Dictionary Matching**

A canonical synonym dictionary maps 50+ known field aliases to internal field names:

```
patient_id, patientid, pid, mrn, uhid, record_id  →  patientId
full_name, patient_name, name, firstname           →  name
sex, gender, patient_gender, patient_sex           →  gender
bp_reading, blood_pressure, systolic_diastolic     →  bloodPressure
pulse, heart_rate, bpm, beats_per_minute           →  heartRate
fbs, rbs, blood_glucose, blood_sugar               →  bloodSugar
```

**Step 3 — Fuzzy Matching (Levenshtein Distance)**

For any field NOT in the dictionary, the algorithm finds the closest match
with an edit distance ≤ 2. This handles:
- Typos: `mobileno` → `mobile`
- Abbreviations: `ph_no` → `phone`
- Minor variations: `wt_kg` → `weight`

**Step 4 — Value Normalization**

After field mapping, all values are normalized:

| Raw Value | Normalized |
|---|---|
| `"M"`, `"male"`, `"man"`, `"1"` | `"male"` |
| `"F"`, `"female"`, `"woman"`, `"2"` | `"female"` |
| `"Diabetes, Hypertension"` (string) | `["Diabetes", "Hypertension"]` (array) |
| `["Aspirin", "Metformin"]` (array) | `["Aspirin", "Metformin"]` (kept) |
| `"2024-12-15"`, `"15/12/2024"` | JavaScript `Date` object |
| height=168cm + weight=82kg, no BMI | BMI auto-calculated = 29.0 |

---

## 3. Conversion Layer Design

```
Raw Hospital JSON (any format)
          │
          ▼
    flattenObject()
    ─────────────────
    Removes all nesting.
    vitals.bpm → vitals.bpm (accessible as flat key)
          │
          ▼
    findCanonicalField()
    ─────────────────────
    For each key:
    1. Check synonym dictionary (exact match)
    2. If not found → Levenshtein fuzzy match (distance ≤ 2)
    3. If still not found → field is ignored
          │
          ▼
    Value Normalization
    ───────────────────
    gender strings, date parsing,
    array/string unification, BMI calculation
          │
          ▼
    Unified Patient Schema
    ──────────────────────
    { name, age, gender, phone, email,
      bloodGroup, diagnoses[], medications[],
      allergies[], vitals{}, lastVisit, ... }
          │
          ▼
    Saved to MongoDB (Patient collection)
```

**Key design principle:** No `if (hospital === "Apollo")` logic anywhere in the codebase.
The system works purely on field name semantics, making it compatible with
any new hospital format automatically.

---

## 4. LLM Prompt Strategy

APIE uses a **hybrid approach** combining deterministic rule-based logic
with LLM reasoning. This avoids hallucinations while producing human-readable insights.

### Step 1 — Rule-Based Risk Scoring (always runs first)

Before calling the LLM, a deterministic scoring algorithm calculates a 0–100 risk score:

```
Age scoring:
  ≥ 70 years   → +25 points
  60–69 years  → +15 points
  50–59 years  → +8 points

Diagnosis scoring (max 40 points):
  diabetes, hypertension, CAD, COPD,
  kidney disease, stroke, cancer, etc. → +12 each

Vitals scoring:
  BP ≥ 180/120 (hypertensive crisis) → +20
  BP ≥ 140/90                        → +10
  Blood sugar > 300                  → +20
  Blood sugar > 200                  → +12
  SpO2 < 90%                         → +25 (critical)
  SpO2 < 95%                         → +12
  Abnormal heart rate                → +10
  BMI ≥ 35                           → +12

Polypharmacy (>5 medications)        → +8

Final level:
  0–19   → low
  20–44  → medium
  45–69  → high
  70–100 → critical
```

This score is passed to the LLM as **ground truth**, preventing the AI from
inventing or contradicting the risk level.

### Step 2 — LLM Call (Google Gemini 1.5 Flash)

The LLM receives two prompts:

**System Prompt** — Enforces JSON-only output:
```
You are a clinical health AI assistant generating patient health insights.
You must respond ONLY with a valid JSON object. No markdown, no explanation, no preamble.
The JSON must follow this exact structure: { ... }
```

**User Prompt** — Full clinical context:
```
NAME: Ramesh Kumar
AGE: 58
GENDER: male
DIAGNOSES: Diabetes Type 2, Hypertension
MEDICATIONS: Metformin 500mg, Amlodipine 5mg
VITALS: BP: 148/92, HR: 88 bpm, Weight: 82kg, BMI: 29.0
PRE-COMPUTED RISK SCORE: 47/100 (HIGH)
RISK FACTORS IDENTIFIED: Age 50-59, Diagnosis: diabetes, High blood pressure
```

The LLM generates:
- Patient summary (2-3 clinical sentences)
- Weekly recommendations (7 days)
- Dietary advice
- Exercise advice
- Medication reminders
- Warning flags

### Step 3 — LLM Output Validation

Before saving, the response is validated:

```
✅ summary exists and is a string
✅ healthRiskIndicator.level is one of: low|medium|high|critical
✅ weeklyRecommendations has exactly 7 entries
✅ generalRecommendations is an array
✅ dietaryAdvice and exerciseAdvice exist
```

If validation fails → warning is logged, fallback is used.

### Step 4 — Graceful Fallback

If the LLM call fails (API error, timeout, invalid JSON) OR validation fails,
the system automatically generates a rule-based fallback report.
The system **never fails silently** — patients always get a report.

```
LLM call
    │
    ├── Success + Validation pass → Save LLM insight
    │
    ├── Success + Validation fail → Log warning, save with flag
    │
    └── LLM error / timeout → Use rule-based fallback, save anyway
```

---

## 5. Security Implementation

### Access Token

- Generated using `crypto.randomBytes(32)` → 64-character cryptographic hex string
- Unique per patient, stored in MongoDB `AccessToken` collection
- Expires after **7 days** (TTL index auto-deletes from DB)
- Marked as `used: true` immediately after successful OTP verification
- Once used, all subsequent requests return 410 Gone

### OTP System

- 6-digit numeric OTP generated server-side
- Expires in **10 minutes**
- Maximum **5 attempts** before permanent lockout for that token
- Phone number is verified against the patient's stored record before OTP is issued
- OTP is printed to console (simulated SMS — Twilio/Nodemailer ready slot in `otpService.js`)

### Single-Use Link Flow

```
1. Patient opens:  /report?token=xxxxx
2. Enters phone number → backend verifies phone matches patient record
3. OTP generated → sent (console simulated)
4. Patient enters OTP → backend verifies OTP
5. Token immediately marked used: true
6. Report returned in same response
7. Any future request with same token → 410 "Already used"
```

### No Third-Party Auth Tools

Custom implementation using Node.js `crypto` module, MongoDB, and Express.
No Firebase, Auth0, or Passport.js.

### Rate Limiting

| Route | Limit |
|---|---|
| OTP request | 5 requests / 15 minutes per IP |
| Ingest | 20 requests / 15 minutes per IP |
| General API | 100 requests / 15 minutes per IP |

---

## 6. API Design

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ingest` | Ingest raw patient data from any hospital format |
| `POST` | `/api/ingest/process` | Generate AI insights + access tokens for all unprocessed patients |
| `POST` | `/api/report/request-otp` | Validate token + phone, generate and send OTP |
| `POST` | `/api/report/verify` | Verify OTP, mark token used, return full insight report |
| `GET` | `/health` | Server health check |
| `GET` | `/api-docs` | Swagger interactive API documentation |

Full interactive API docs available at: `http://localhost:5000/api-docs`

---

## 7. Limitations

**1. OTP delivery is simulated**
OTP is printed to the backend console instead of being sent via SMS or email.
In production, `otpService.js` would integrate Twilio (SMS) or Nodemailer (email).

**2. Ingest API is unauthenticated**
`/api/ingest` is open — any client can send patient data.
In production, hospital API keys or signed JWTs would secure this endpoint.

**3. Single-use is browser-session-based**
If the user closes the browser before downloading the report, they cannot
re-access it. A download warning is shown but browser close cannot be prevented.

**4. Fuzzy matching has coverage limits**
Levenshtein distance works well for Latin-script English field names.
Field names in other languages or very heavy abbreviations may not match.
Solution: extend the synonym dictionary for specific hospital formats.

**5. LLM cost at scale**
Gemini API free tier has request limits. High volume processing would require
the paid tier or a queuing/batching strategy.

**6. No webhook or real-time notification**
When insights are generated, patients are not notified automatically.
The message simulation only runs during the seed/ingest process.
Production would need a notification queue (e.g., BullMQ + Twilio).