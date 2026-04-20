const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "APIE - Autonomous Patient Insight Engine",
            version: "1.0.0",
            description: "API documentation for APIE Backend — Patient data ingestion, AI insight generation, and secure report access via OTP.",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development Server",
            },
        ],
        components: {
            schemas: {
                // ── Patient ──────────────────────────────
                Patient: {
                    type: "object",
                    properties: {
                        patientId: { type: "string", example: "APL-001" },
                        name: { type: "string", example: "Ramesh Kumar" },
                        age: { type: "number", example: 58 },
                        gender: { type: "string", enum: ["male", "female", "other", "unknown"], example: "male" },
                        phone: { type: "string", example: "9876543210" },
                        email: { type: "string", example: "ramesh@gmail.com" },
                        bloodGroup: { type: "string", example: "B+" },
                        diagnoses: { type: "array", items: { type: "string" }, example: ["Diabetes Type 2", "Hypertension"] },
                        medications: { type: "array", items: { type: "string" }, example: ["Metformin 500mg"] },
                        allergies: { type: "array", items: { type: "string" }, example: ["Penicillin"] },
                        vitals: {
                            type: "object",
                            properties: {
                                bloodPressure: { type: "string", example: "148/92" },
                                heartRate: { type: "number", example: 88 },
                                temperature: { type: "number", example: 98.6 },
                                weight: { type: "number", example: 82 },
                                height: { type: "number", example: 168 },
                                bmi: { type: "number", example: 29.0 },
                                bloodSugar: { type: "number", example: 210 },
                                oxygenSaturation: { type: "number", example: 98 },
                            },
                        },
                        lastVisit: { type: "string", format: "date", example: "2024-12-15" },
                        sourceHospital: { type: "string", example: "Apollo Hospital Delhi" },
                    },
                },

                // ── Insight ──────────────────────────────
                PatientInsight: {
                    type: "object",
                    properties: {
                        summary: { type: "string", example: "Patient has Diabetes and Hypertension with high risk score." },
                        healthRiskIndicator: {
                            type: "object",
                            properties: {
                                level: { type: "string", enum: ["low", "medium", "high", "critical"], example: "high" },
                                score: { type: "number", example: 54 },
                                factors: { type: "array", items: { type: "string" }, example: ["High blood pressure", "High blood sugar"] },
                            },
                        },
                        weeklyRecommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    day: { type: "string", example: "Monday" },
                                    recommendation: { type: "string", example: "Monitor blood sugar levels in the morning." },
                                },
                            },
                        },
                        generalRecommendations: { type: "array", items: { type: "string" } },
                        dietaryAdvice: { type: "string", example: "Avoid sugar and processed foods." },
                        exerciseAdvice: { type: "string", example: "30 min walk daily." },
                        medicationReminders: { type: "array", items: { type: "string" } },
                        warningFlags: { type: "array", items: { type: "string" } },
                    },
                },

                // ── Ingest Request ────────────────────────
                IngestRequest: {
                    type: "object",
                    required: ["patients"],
                    properties: {
                        sourceHospital: { type: "string", example: "Apollo Hospital Delhi" },
                        patients: {
                            type: "array",
                            items: { type: "object" },
                            example: [
                                {
                                    patient_id: "APL-001",
                                    full_name: "Ramesh Kumar",
                                    age: 58,
                                    sex: "M",
                                    conditions: "Diabetes Type 2",
                                    bp_reading: "148/92",
                                },
                            ],
                        },
                    },
                },

                // ── OTP Request ───────────────────────────
                OTPRequest: {
                    type: "object",
                    required: ["token"],
                    properties: {
                        token: { type: "string", example: "b9a73f8c13b0928afdd57ca3e28ec1f4175812faa65df95f427b6fb986917b0a" },
                    },
                },

                // ── OTP Verify ────────────────────────────
                OTPVerify: {
                    type: "object",
                    required: ["token", "otp"],
                    properties: {
                        token: { type: "string", example: "b9a73f8c13b0928afdd57ca3e28ec1f4175812faa65df95f427b6fb986917b0a" },
                        otp: { type: "string", example: "123456" },
                    },
                },

                // ── Success Response ──────────────────────
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Operation successful" },
                    },
                },

                // ── Error Response ────────────────────────
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string", example: "Something went wrong" },
                    },
                },
            },
        },
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;