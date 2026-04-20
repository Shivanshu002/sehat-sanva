const crypto = require("crypto");
const AccessToken = require("../models/AccessToken");

// ── Generate Access Token ────────────────────
const generateAccessToken = async (patientId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const accessToken = await AccessToken.create({
    token,
    patientId,
    expiresAt,
  });

  return accessToken;
};

// ── Generate OTP ─────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const attachOTPToToken = async (token) => {
  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const updated = await AccessToken.findOneAndUpdate(
    { token, used: false },
    {
      otp,
      otpExpiresAt,
      otpVerified: false,
      otpAttempts: 0,
    },
    { new: true }
  );

  if (!updated) throw new Error("Invalid or expired access token");

  return otp;
};

// ── Verify OTP ───────────────────────────────
const verifyOTP = async (token, otp) => {
  const record = await AccessToken.findOne({ token });

  if (!record) throw new Error("Invalid or expired access token");

  // Single use check
  if (record.used) {
    throw new Error("This link has already been used. Each link is accessible only once.");
  }

  if (record.otpAttempts >= 5) {
    throw new Error("Too many OTP attempts. Request a new link.");
  }

  if (!record.otp || new Date() > record.otpExpiresAt) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (record.otp !== otp) {
    await AccessToken.findByIdAndUpdate(record._id, {
      $inc: { otpAttempts: 1 },
    });
    throw new Error("Incorrect OTP");
  }

  await AccessToken.findByIdAndUpdate(record._id, {
    otpVerified: true,
  });

  return record.patientId;
};

// ── Validate Token ───────────────────────────
const validateToken = async (token) => {
  const record = await AccessToken.findOne({ token });

  if (!record) throw new Error("Invalid access token");
  if (record.used) throw new Error("This link has already been used.");
  if (new Date() > record.expiresAt) throw new Error("Access token has expired");
  if (!record.otpVerified) throw new Error("OTP verification required");

  return record.patientId;
};

module.exports = {
  generateAccessToken,
  attachOTPToToken,
  verifyOTP,
  validateToken,
};