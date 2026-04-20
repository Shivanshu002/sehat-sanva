/**
 * PATIENT INSIGHT ENGINE
 *
 * Combines:
 * 1. Rule-based risk scoring (deterministic, fast)
 * 2. LLM reasoning (contextual, human-like summaries)
 * 3. Output validation (ensure structure before saving)
 */

const { callLLM } = require("../config/llm");

// ─────────────────────────────────────────────
// RULE-BASED RISK SCORING
// ─────────────────────────────────────────────

const HIGH_RISK_DIAGNOSES = [
    "diabetes", "hypertension", "heart disease", "cardiac", "kidney disease",
    "renal failure", "stroke", "cancer", "copd", "liver cirrhosis",
    "coronary artery disease", "hiv", "tuberculosis", "sepsis",
];

const computeRuleBasedRisk = (patient) => {
    let score = 0;
    const factors = [];

    // Age risk
    if (patient.age) {
        if (patient.age >= 70) { score += 25; factors.push("Age ≥ 70"); }
        else if (patient.age >= 60) { score += 15; factors.push("Age 60-69"); }
        else if (patient.age >= 50) { score += 8; factors.push("Age 50-59"); }
    }

    // Diagnoses risk
    const diagText = (patient.diagnoses || []).join(" ").toLowerCase();
    let diagScore = 0;
    for (const d of HIGH_RISK_DIAGNOSES) {
        if (diagText.includes(d)) {
            diagScore += 12;
            factors.push(`Diagnosis: ${d}`);
        }
    }
    score += Math.min(diagScore, 40);

    // Vitals risk
    const v = patient.vitals || {};

    if (v.bloodPressure) {
        const [sys, dia] = v.bloodPressure.split("/").map(Number);
        if (sys >= 180 || dia >= 120) { score += 20; factors.push("Hypertensive crisis"); }
        else if (sys >= 140 || dia >= 90) { score += 10; factors.push("High blood pressure"); }
        else if (sys <= 90) { score += 10; factors.push("Low blood pressure"); }
    }

    if (v.bloodSugar) {
        if (v.bloodSugar > 300) { score += 20; factors.push("Critical blood sugar"); }
        else if (v.bloodSugar > 200) { score += 12; factors.push("High blood sugar"); }
        else if (v.bloodSugar < 70) { score += 15; factors.push("Low blood sugar (hypoglycemia)"); }
    }

    if (v.oxygenSaturation) {
        if (v.oxygenSaturation < 90) { score += 25; factors.push("Critical oxygen saturation"); }
        else if (v.oxygenSaturation < 95) { score += 12; factors.push("Low oxygen saturation"); }
    }

    if (v.heartRate) {
        if (v.heartRate > 120 || v.heartRate < 50) { score += 10; factors.push("Abnormal heart rate"); }
    }

    if (v.bmi) {
        if (v.bmi >= 35) { score += 12; factors.push("Severe obesity (BMI ≥ 35)"); }
        else if (v.bmi >= 30) { score += 7; factors.push("Obesity (BMI 30-34)"); }
        else if (v.bmi < 18.5) { score += 7; factors.push("Underweight"); }
    }

    if ((patient.medications || []).length > 5) {
        score += 8;
        factors.push("Polypharmacy (>5 medications)");
    }

    score = Math.min(score, 100);

    let level;
    if (score >= 70) level = "critical";
    else if (score >= 45) level = "high";
    else if (score >= 20) level = "medium";
    else level = "low";

    return { score, level, factors };
};

// ─────────────────────────────────────────────
// LLM PROMPT BUILDER
// ─────────────────────────────────────────────

const buildInsightPrompt = (patient, riskResult) => {
    const systemPrompt = `You are a clinical health AI assistant generating patient health insights.
You must respond ONLY with a valid JSON object. No markdown, no explanation, no preamble.
The JSON must follow this exact structure:
{
  "summary": "2-3 sentence clinical summary of the patient",
  "healthRiskIndicator": {
    "level": "low|medium|high|critical",
    "score": <number 0-100>,
    "factors": ["factor1", "factor2"]
  },
  "weeklyRecommendations": [
    { "day": "Monday", "recommendation": "..." },
    { "day": "Tuesday", "recommendation": "..." },
    { "day": "Wednesday", "recommendation": "..." },
    { "day": "Thursday", "recommendation": "..." },
    { "day": "Friday", "recommendation": "..." },
    { "day": "Saturday", "recommendation": "..." },
    { "day": "Sunday", "recommendation": "..." }
  ],
  "generalRecommendations": ["rec1", "rec2", "rec3"],
  "dietaryAdvice": "Specific dietary advice based on conditions",
  "exerciseAdvice": "Specific exercise advice based on patient condition",
  "medicationReminders": ["reminder1", "reminder2"],
  "warningFlags": ["flag1"]
}
Use clinical language but keep it understandable by a non-medical person.`;

    const userPrompt = `Generate health insights for this patient:

NAME: ${patient.name}
AGE: ${patient.age || "Not provided"}
GENDER: ${patient.gender}
BLOOD GROUP: ${patient.bloodGroup || "Not provided"}

DIAGNOSES: ${(patient.diagnoses || []).join(", ") || "None recorded"}
MEDICATIONS: ${(patient.medications || []).join(", ") || "None recorded"}
ALLERGIES: ${(patient.allergies || []).join(", ") || "None recorded"}

VITALS:
- Blood Pressure: ${patient.vitals?.bloodPressure || "Not recorded"}
- Heart Rate: ${patient.vitals?.heartRate || "Not recorded"} bpm
- Temperature: ${patient.vitals?.temperature || "Not recorded"} °F
- Weight: ${patient.vitals?.weight || "Not recorded"} kg
- Height: ${patient.vitals?.height || "Not recorded"} cm
- BMI: ${patient.vitals?.bmi || "Not recorded"}
- Blood Sugar: ${patient.vitals?.bloodSugar || "Not recorded"} mg/dL
- Oxygen Saturation: ${patient.vitals?.oxygenSaturation || "Not recorded"}%

LAST VISIT: ${patient.lastVisit ? new Date(patient.lastVisit).toDateString() : "Not recorded"}

PRE-COMPUTED RISK SCORE: ${riskResult.score}/100 (${riskResult.level.toUpperCase()})
RISK FACTORS IDENTIFIED: ${riskResult.factors.join(", ") || "None"}

Generate a complete, personalized health insight report in the specified JSON format.`;

    return { systemPrompt, userPrompt };
};

// ─────────────────────────────────────────────
// LLM RESPONSE VALIDATOR
// ─────────────────────────────────────────────

const validateInsightResponse = (parsed) => {
    const errors = [];

    if (!parsed.summary || typeof parsed.summary !== "string")
        errors.push("Missing or invalid summary");

    if (!parsed.healthRiskIndicator || !["low", "medium", "high", "critical"].includes(parsed.healthRiskIndicator.level))
        errors.push("Invalid healthRiskIndicator.level");

    if (!Array.isArray(parsed.weeklyRecommendations) || parsed.weeklyRecommendations.length !== 7)
        errors.push("weeklyRecommendations must have exactly 7 days");

    if (!Array.isArray(parsed.generalRecommendations))
        errors.push("generalRecommendations must be array");

    if (!parsed.dietaryAdvice) errors.push("Missing dietaryAdvice");
    if (!parsed.exerciseAdvice) errors.push("Missing exerciseAdvice");

    return errors;
};

// ─────────────────────────────────────────────
// FALLBACK: if LLM fails, use rule-based only
// ─────────────────────────────────────────────

const generateFallbackInsight = (patient, riskResult) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const fallbackRecs = [
        "Monitor vitals and take medications as prescribed",
        "Stay hydrated - drink at least 8 glasses of water",
        "Get 7-8 hours of sleep",
        "Light 30-minute walk if health permits",
        "Attend any scheduled follow-up appointments",
        "Avoid processed and high-sodium foods",
        "Rest and review week's health metrics",
    ];

    return {
        summary: `Patient ${patient.name}, age ${patient.age || "unknown"}, with ${(patient.diagnoses || []).join(", ") || "no recorded diagnoses"}. Risk level is ${riskResult.level} based on clinical parameters.`,
        healthRiskIndicator: riskResult,
        weeklyRecommendations: days.map((day, i) => ({
            day,
            recommendation: fallbackRecs[i],
        })),
        generalRecommendations: [
            "Follow prescribed medication schedule",
            "Regular health monitoring recommended",
            "Consult your doctor for any new symptoms",
        ],
        dietaryAdvice: "Maintain a balanced diet rich in fruits, vegetables, and whole grains. Limit sugar, salt, and saturated fat.",
        exerciseAdvice: "Engage in light physical activity as tolerated. Consult doctor before starting new exercise routine.",
        medicationReminders: patient.medications?.length
            ? [`Take your medications: ${patient.medications.join(", ")}`]
            : [],
        warningFlags: riskResult.factors.slice(0, 3),
        generatedAt: new Date(),
        llmModel: "fallback-rule-based",
        validationPassed: true,
    };
};

// ─────────────────────────────────────────────
// MAIN INSIGHT GENERATOR
// ─────────────────────────────────────────────

const generatePatientInsight = async (patient) => {
    // Step 1: Rule-based risk scoring (always runs)
    const riskResult = computeRuleBasedRisk(patient);

    // Step 2: Build LLM prompt
    const { systemPrompt, userPrompt } = buildInsightPrompt(patient, riskResult);

    let insightData;

    try {
        // Step 3: Call LLM
        const rawResponse = await callLLM(systemPrompt, userPrompt);

        // Step 4: Parse JSON from LLM response
        const cleanedResponse = rawResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const parsed = JSON.parse(cleanedResponse);

        // Step 5: Validate LLM output
        const validationErrors = validateInsightResponse(parsed);

        if (validationErrors.length > 0) {
            console.warn(`⚠️  LLM validation failed for ${patient.name}:`, validationErrors);
        }

        insightData = {
            ...parsed,
            // Always use rule-based score as ground truth
            healthRiskIndicator: {
                level: riskResult.level,
                score: riskResult.score,
                factors: [...new Set([...(parsed.healthRiskIndicator?.factors || []), ...riskResult.factors])],
            },
            generatedAt: new Date(),
            llmModel: "claude-sonnet-4",
            validationPassed: validationErrors.length === 0,
        };
    } catch (err) {
        console.error(`❌ LLM call failed for ${patient.name}:`, err.message);
        // Graceful degradation: use rule-based fallback
        insightData = generateFallbackInsight(patient, riskResult);
    }

    return insightData;
};

module.exports = { generatePatientInsight, computeRuleBasedRisk };