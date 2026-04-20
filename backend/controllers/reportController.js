const Patient = require("../models/Patient");
const PatientInsight = require("../models/PatientInsight");
const AccessToken = require("../models/AccessToken");
const {
  attachOTPToToken,
  verifyOTP,
} = require("../services/accessTokenService");

// ─────────────────────────────────────────────
// POST /api/report/request-otp
// ─────────────────────────────────────────────
const requestOTP = async (req, res, next) => {
  try {
    const { token, phone } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    // Check token exists and is not expired
    const record = await AccessToken.findOne({ token }).populate("patientId");

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Invalid access token",
      });
    }

    if (new Date() > record.expiresAt) {
      return res.status(410).json({
        success: false,
        error: "Access token has expired. Please contact your hospital.",
      });
    }

    // Check if already used
    if (record.used) {
      return res.status(410).json({
        success: false,
        error: "This link has already been used. Each link is accessible only once.",
      });
    }

    const patient = record.patientId;

    // Verify phone matches patient record
    if (patient.phone && patient.phone !== phone) {
      return res.status(403).json({
        success: false,
        error: "Phone number does not match our records.",
      });
    }

    // Generate and attach OTP
    const otp = await attachOTPToToken(token);

    // Simulate sending message to patient
    console.log("\n" + "=".repeat(60));
    console.log("📨 PATIENT MESSAGE SIMULATION");
    console.log("=".repeat(60));
    console.log(`To      : ${patient.name}`);
    console.log(`Phone   : ${phone}`);
    console.log(`Message : Hello ${patient.name}, your OTP to access`);
    console.log(`          your health report is: ${otp}`);
    console.log(`          This OTP is valid for 10 minutes.`);
    console.log(`          Do not share this with anyone.`);
    console.log("=".repeat(60) + "\n");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      hint: `OTP sent to phone ending in ${String(phone).slice(-4)}`,
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/report/verify
// ─────────────────────────────────────────────
const verifyOTPAndGetReport = async (req, res, next) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        error: "Both 'token' and 'otp' are required",
      });
    }

    // Verify OTP
    const patientObjectId = await verifyOTP(token, otp);

    // ── Mark token as USED (single-use enforcement) ──
    await AccessToken.findOneAndUpdate(
      { token },
      { used: true, usedAt: new Date() }
    );

    // Fetch patient
    const patient = await Patient.findById(patientObjectId).select(
      "-rawDataSnapshot -__v"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient record not found",
      });
    }

    // Fetch insight
    const insight = await PatientInsight.findOne({
      patientId: patientObjectId,
    }).select("-__v");

    if (!insight) {
      return res.status(404).json({
        success: false,
        error: "Insight report not yet generated for this patient",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: {
        patient: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          phone: patient.phone,
          email: patient.email,
          diagnoses: patient.diagnoses,
          medications: patient.medications,
          allergies: patient.allergies,
          vitals: patient.vitals,
          lastVisit: patient.lastVisit,
          sourceHospital: patient.sourceHospital,
        },
        insight: {
          summary: insight.summary,
          healthRiskIndicator: insight.healthRiskIndicator,
          weeklyRecommendations: insight.weeklyRecommendations,
          generalRecommendations: insight.generalRecommendations,
          dietaryAdvice: insight.dietaryAdvice,
          exerciseAdvice: insight.exerciseAdvice,
          medicationReminders: insight.medicationReminders,
          warningFlags: insight.warningFlags,
          generatedAt: insight.generatedAt,
          validationPassed: insight.validationPassed,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requestOTP, verifyOTPAndGetReport };