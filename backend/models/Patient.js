const mongoose = require("mongoose");

// Unified internal schema - all hospital formats normalize into this
const PatientSchema = new mongoose.Schema(
  {
    // Core identity
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other", "unknown"], default: "unknown" },
    phone: { type: String },
    email: { type: String },
    bloodGroup: { type: String },

    // Clinical data
    diagnoses: [{ type: String }],
    medications: [{ type: String }],
    allergies: [{ type: String }],
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      bmi: { type: Number },
      bloodSugar: { type: Number },
      oxygenSaturation: { type: Number },
    },
    lastVisit: { type: Date },
    admissionDate: { type: Date },
    dischargeDate: { type: Date },

    // Source tracking
    sourceHospital: { type: String },
    sourceFormat: { type: String },
    rawDataSnapshot: { type: mongoose.Schema.Types.Mixed },

    // Processing status
    insightGenerated: { type: Boolean, default: false },
    accessLinkSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", PatientSchema);