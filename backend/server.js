require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const { apiLimiter, otpLimiter, ingestLimiter } = require("./middlewares/rateLimiter");
const swaggerSpec = require("./config/swagger");

const ingestRoutes = require("./routes/ingestRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// ── Swagger Docs ───────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "APIE API Docs",
  customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
}));

// ── Health Check ───────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "APIE - Autonomous Patient Insight Engine",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────
app.use("/api/ingest", ingestLimiter, ingestRoutes);
app.use("/api/report", reportRoutes);

// ── 404 Handler ───────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log("\n🚀 APIE Backend running on port", PORT);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log(`🏥 Health:   http://localhost:${PORT}/health`);
    console.log(`📋 Swagger:   http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Env:      ${process.env.NODE_ENV || "development"}\n`);
  });
};

startServer();

module.exports = app;