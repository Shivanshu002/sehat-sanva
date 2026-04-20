/**
 * DYNAMIC SCHEMA NORMALIZATION ENGINE
 *
 * This service handles the core challenge:
 * "Accept multiple patient data formats and map them to a unified internal schema"
 *
 * How it works:
 * 1. Field fingerprinting: build a map of all keys in incoming data (flattened)
 * 2. Semantic matching: match unknown field names to known canonical fields using
 *    synonym dictionaries + string similarity scoring
 * 3. Value normalization: normalize values (gender strings, date formats, etc.)
 * 4. Missing field handling: fill defaults or mark as unknown
 *
 * No hardcoded per-dataset logic. Works for unseen formats.
 */

// ─────────────────────────────────────────────
// CANONICAL FIELD SYNONYMS
// ─────────────────────────────────────────────
const FIELD_SYNONYMS = {
  patientId: [
    "patient_id", "patientid", "pid", "id", "patient_no", "patientno",
    "mrn", "medical_record_number", "record_id", "recordid", "uhid",
    "registration_no", "reg_no", "case_id",
  ],
  name: [
    "name", "full_name", "fullname", "patient_name", "patientname",
    "first_name", "firstname", "last_name", "lastname", "patient_full_name",
  ],
  age: ["age", "patient_age", "years", "age_years", "age_in_years"],
  gender: [
    "gender", "sex", "patient_gender", "patient_sex", "g", "gen",
  ],
  phone: [
    "phone", "mobile", "contact", "phone_number", "phonenumber",
    "mobile_number", "mobilenumber", "contact_number", "cell",
    "telephone", "tel", "ph_no",
  ],
  email: ["email", "email_id", "emailid", "e_mail", "mail"],
  bloodGroup: [
    "blood_group", "bloodgroup", "blood_type", "bloodtype",
    "bg", "blood", "abo_group",
  ],
  diagnoses: [
    "diagnoses", "diagnosis", "conditions", "medical_conditions",
    "diseases", "disease", "icd_codes", "problems", "ailments",
    "presenting_complaints", "chief_complaints",
  ],
  medications: [
    "medications", "medication", "medicines", "medicine", "drugs",
    "prescriptions", "prescription", "current_medications", "treatment",
  ],
  allergies: [
    "allergies", "allergy", "allergens", "known_allergies", "drug_allergies",
  ],
  bloodPressure: [
    "blood_pressure", "bloodpressure", "bp", "b_p", "systolic_diastolic",
    "bp_reading",
  ],
  heartRate: [
    "heart_rate", "heartrate", "hr", "pulse", "pulse_rate",
    "bpm", "beats_per_minute",
  ],
  temperature: [
    "temperature", "temp", "body_temp", "body_temperature", "fever",
  ],
  weight: ["weight", "wt", "body_weight", "weight_kg", "wt_kg"],
  height: ["height", "ht", "body_height", "height_cm", "ht_cm"],
  bmi: ["bmi", "body_mass_index", "bmi_value"],
  bloodSugar: [
    "blood_sugar", "bloodsugar", "glucose", "blood_glucose",
    "fasting_glucose", "sugar_level", "fbs", "rbs",
  ],
  oxygenSaturation: [
    "oxygen_saturation", "spo2", "o2_sat", "oxygen_level", "oximetry",
  ],
  lastVisit: [
    "last_visit", "lastvisit", "last_visit_date", "visit_date",
    "last_consultation", "last_checkup",
  ],
  admissionDate: [
    "admission_date", "admissiondate", "admitted_on", "date_of_admission",
    "doa",
  ],
  dischargeDate: [
    "discharge_date", "dischargedate", "discharged_on", "date_of_discharge",
    "dod",
  ],
};

// ─────────────────────────────────────────────
// GENDER NORMALIZATION MAP
// ─────────────────────────────────────────────
const GENDER_MAP = {
  m: "male", male: "male", man: "male", boy: "male", "1": "male",
  f: "female", female: "female", woman: "female", girl: "female", "2": "female",
  o: "other", other: "other", transgender: "other", nonbinary: "other",
};

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

const normalizeKey = (key) =>
  String(key).toLowerCase().replace(/[\s\-\.]/g, "_").replace(/[^a-z0-9_]/g, "");

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const buildSynonymLookup = () => {
  const lookup = {};
  for (const [canonical, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const syn of synonyms) {
      lookup[normalizeKey(syn)] = canonical;
    }
  }
  return lookup;
};

const SYNONYM_LOOKUP = buildSynonymLookup();

const findCanonicalField = (rawKey) => {
  const nk = normalizeKey(rawKey);

  if (SYNONYM_LOOKUP[nk]) return SYNONYM_LOOKUP[nk];

  let best = null, bestDist = Infinity;
  for (const [syn, canonical] of Object.entries(SYNONYM_LOOKUP)) {
    const dist = levenshtein(nk, syn);
    if (dist < bestDist && dist <= 2) {
      bestDist = dist;
      best = canonical;
    }
  }
  return best;
};

const flattenObject = (obj, prefix = "") => {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(result, flattenObject(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
};

const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") return val.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  return [String(val)];
};

// ─────────────────────────────────────────────
// MAIN NORMALIZER
// ─────────────────────────────────────────────

const normalizePatient = (rawData, sourceHospital = "unknown") => {
  const flattened = flattenObject(rawData);
  const mappingLog = {};

  const resolved = {};

  for (const [rawKey, rawVal] of Object.entries(flattened)) {
    const segments = rawKey.split(".");
    for (const seg of [...new Set([rawKey, segments[segments.length - 1]])]) {
      const canonical = findCanonicalField(seg);
      if (canonical && resolved[canonical] === undefined) {
        resolved[canonical] = rawVal;
        mappingLog[rawKey] = canonical;
        break;
      }
    }
  }

  const unified = {
    patientId: String(resolved.patientId || rawData.id || rawData._id || `AUTO-${Date.now()}`),
    name: String(resolved.name || "Unknown Patient"),
    age: resolved.age ? parseInt(resolved.age) : null,
    gender: GENDER_MAP[String(resolved.gender || "").toLowerCase()] || "unknown",
    phone: resolved.phone ? String(resolved.phone) : null,
    email: resolved.email ? String(resolved.email).toLowerCase() : null,
    bloodGroup: resolved.bloodGroup ? String(resolved.bloodGroup).toUpperCase() : null,

    diagnoses: ensureArray(resolved.diagnoses),
    medications: ensureArray(resolved.medications),
    allergies: ensureArray(resolved.allergies),

    vitals: {
      bloodPressure: resolved.bloodPressure ? String(resolved.bloodPressure) : null,
      heartRate: resolved.heartRate ? parseFloat(resolved.heartRate) : null,
      temperature: resolved.temperature ? parseFloat(resolved.temperature) : null,
      weight: resolved.weight ? parseFloat(resolved.weight) : null,
      height: resolved.height ? parseFloat(resolved.height) : null,
      bmi: resolved.bmi ? parseFloat(resolved.bmi) : null,
      bloodSugar: resolved.bloodSugar ? parseFloat(resolved.bloodSugar) : null,
      oxygenSaturation: resolved.oxygenSaturation ? parseFloat(resolved.oxygenSaturation) : null,
    },

    lastVisit: parseDate(resolved.lastVisit),
    admissionDate: parseDate(resolved.admissionDate),
    dischargeDate: parseDate(resolved.dischargeDate),

    sourceHospital,
    sourceFormat: detectFormat(rawData),
    rawDataSnapshot: rawData,
  };

  // Auto-calculate BMI if missing
  if (!unified.vitals.bmi && unified.vitals.weight && unified.vitals.height) {
    const hm = unified.vitals.height / 100;
    unified.vitals.bmi = parseFloat((unified.vitals.weight / (hm * hm)).toFixed(1));
  }

  return { unified, mappingLog };
};

const detectFormat = (rawData) => {
  const keys = Object.keys(flattenObject(rawData)).join(",").toLowerCase();
  if (keys.includes("mrn")) return "format_mrn";
  if (keys.includes("uhid")) return "format_uhid";
  if (keys.includes("pid")) return "format_pid";
  return "format_generic";
};

const normalizeBatch = (records, sourceHospital) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    try {
      const { unified, mappingLog } = normalizePatient(records[i], sourceHospital);
      results.push({ unified, mappingLog, index: i });
    } catch (err) {
      errors.push({ index: i, error: err.message, raw: records[i] });
    }
  }

  return { results, errors };
};

module.exports = { normalizePatient, normalizeBatch, findCanonicalField, flattenObject };