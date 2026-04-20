const rateLimit = require("express-rate-limit");

// General API limiter — all routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again after 15 minutes.",
  },
});

// OTP routes — stricter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    error: "Too many OTP requests. Please wait 10 minutes.",
  },
});

// Ingest routes — moderate
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: "Too many ingest requests. Slow down.",
  },
});

module.exports = { apiLimiter, otpLimiter, ingestLimiter };