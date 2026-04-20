const mongoose = require("mongoose");

const PatientInsightSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    summary: { type: String, required: true },
    healthRiskIndicator: {
      level: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
      score: { type: Number, min: 0, max: 100 },
      factors: [{ type: String }],
    },
    weeklyRecommendations: [
      {
        day: { type: String },
        recommendation: { type: String },
      },
    ],
    generalRecommendations: [{ type: String }],
    dietaryAdvice: { type: String },
    exerciseAdvice: { type: String },
    medicationReminders: [{ type: String }],
    warningFlags: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    llmModel: { type: String },
    validationPassed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientInsight", PatientInsightSchema);