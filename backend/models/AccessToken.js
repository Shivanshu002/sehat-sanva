const mongoose = require("mongoose");

const AccessTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
    // OTP verification
    otp: { type: String },
    otpExpiresAt: { type: Date },
    otpVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for auto-cleanup of expired tokens
AccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AccessToken", AccessTokenSchema);