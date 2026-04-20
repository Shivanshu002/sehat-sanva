# APIE — Architecture Explanation

## 1. How the System Handles Different Data Formats

The core challenge was accepting patient data from hospitals that use completely
different field names, structures, and formats — without hardcoding any
hospital-specific logic.

### Solution: Dynamic Normalization Engine (`normalizerService.js`)

**Step 1 — Flatten**
All incoming data (regardless of nesting depth) is flattened into a single-level
key-value map. This means `vitals.bpm` and `pulse` are both accessible at the
same level for matching.

**Step 2 — Synonym Matching**
A canonical synonym dictionary maps 50+ known field aliases to internal field names:
- `patient_id`, `uhid`, `mrn`, `pid`, `record_id` → `patientId`
- `full_name`, `patient_name`, `name` → `name`
- `bpm`, `pulse`, `heart_rate`, `pulse_rate` → `heartRate`

**Step 3 — Fuzzy Matching (Levenshtein Distance)**
For fields not in the dictionary, Levenshtein distance algorithm finds the closest
match within an edit distance of 2. This handles typos and slight variations
like `mobileno` → `mobile`.

**Step 4 — Value Normalization**
- Gender: `M`, `male`, `man`, `1` → `male`
- Arrays: comma-separated strings → arrays
- Dates: any format → JavaScript Date object
- BMI: auto-calculated if height and weight present

---

## 2. Conversion Layer Design


Raw Hospital Data
↓
flattenObject()        ← removes nesting
↓
findCanonicalField()   ← synonym dict + Levenshtein
↓
Value Normalization    ← gender, dates, arrays
↓
Unified Patient Schema ← saved to MongoDB


**Key design decision:** No `if hospitalA` or `if hospitalB` logic anywhere.
The system works purely on field name semantics, making it compatible with
any new hospital format.

---

## 3. LLM Prompt Strategy

### Hybrid Approach: Rule-Based + LLM

**Step 1 — Rule-Based Risk Score (always runs)**
Before calling the LLM, a deterministic scoring algorithm calculates a
0–100 risk score based on:
- Age (≥70 → +25 points, ≥60 → +15, etc.)
- High-risk diagnoses (diabetes, CAD, COPD, etc. → +12 each, max 40)
- Vitals (hypertensive crisis → +20, critical SpO2 → +25, etc.)
- Polypharmacy (>5 medications → +8)

This score is passed to the LLM as ground truth, preventing hallucination
of risk levels.

**Step 2 — LLM Call (Gemini 1.5 Flash)**
The LLM is prompted with:
- Full patient profile (demographics, diagnoses, vitals, medications)
- Pre-computed risk score and factors
- Strict JSON output format requirement

**Prompt Strategy:**
- System prompt enforces JSON-only output (no markdown, no preamble)
- User prompt provides all clinical context in a structured format
- LLM generates: summary, weekly recommendations, dietary/exercise advice,
  medication reminders, warning flags

**Step 3 — Validation**
LLM response is validated before saving:
- JSON parse check
- Required fields presence check
- Risk level enum validation
- Weekly recommendations count check (must be exactly 7)

**Step 4 — Fallback**
If LLM fails or validation fails, a rule-based fallback generates a
basic but complete insight report ensuring the system never fails silently.

---

## 4. Security Implementation

### Access Token
- 64-character cryptographically random hex token (`crypto.randomBytes(32)`)
- Unique per patient, stored in MongoDB
- Expires after 7 days (TTL index auto-deletes from DB)
- Marked as `used: true` after report is accessed (single-use enforcement)

### OTP System
- 6-digit numeric OTP generated server-side
- Expires in 10 minutes
- Maximum 5 attempts before lockout
- Phone number verified against patient record before OTP is sent
- OTP never stored in plain text in production (hashing recommended)

### Flow

Patient receives link → enters phone → OTP sent (simulated)
→ OTP verified → token marked used → report displayed
→ link no longer works

### No third-party auth tools used
Custom implementation using `crypto` module, MongoDB, and Express middleware.

---

## 5. Limitations

1. **OTP delivery is simulated** — In production, Twilio (SMS) or Nodemailer
   (email) would be integrated for actual OTP delivery.

2. **Phone number validation is basic** — Only checks if it matches the
   stored record. In production, format validation and carrier lookup
   would be added.

3. **LLM cost** — Gemini API has usage limits on free tier. High volume
   processing would require paid tier or batching strategy.

4. **No authentication for ingest API** — The `/api/ingest` endpoint is
   open. In production, hospital API keys or JWT tokens would secure it.

5. **Single-use is session-based** — If the user closes the browser before
   downloading, they cannot access the report again. A download-before-close
   warning is shown but not enforced.

6. **Fuzzy matching has limits** — Very unusual field names (e.g., in
   regional languages or highly abbreviated) may not match correctly.
   A confidence score threshold prevents wrong mappings.