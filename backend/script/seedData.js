require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Hospital A — standard format
const hospitalA = {
    sourceHospital: "Apollo Hospital Delhi",
    patients: [
        {
            patient_id: "APL-001",
            full_name: "Ramesh Kumar",
            age: 58,
            sex: "M",
            mobile: "9319079619",
            email: "ramesh@gmail.com",
            blood_group: "B+",
            conditions: "Diabetes Type 2, Hypertension",
            medicines: "Metformin 500mg, Amlodipine 5mg",
            known_allergies: "Penicillin",
            bp_reading: "148/92",
            pulse: 88,
            body_temp: 98.6,
            wt_kg: 82,
            ht_cm: 168,
            fbs: 210,
            last_visit_date: "2024-12-15",
        },
        {
            patient_id: "APL-002",
            full_name: "Sunita Devi",
            age: 34,
            sex: "F",
            mobile: "6307340868",
            blood_group: "O+",
            conditions: "Thyroid",
            medicines: "Levothyroxine 50mcg",
            bp_reading: "118/76",
            pulse: 72,
            wt_kg: 60,
            ht_cm: 160,
            last_visit_date: "2025-01-10",
        },
    ],
};

// Hospital B — completely different field names and structure
const hospitalB = {
    sourceHospital: "City Medical Center",
    patients: [
        {
            uhid: "CMC-101",
            name: "Mohammad Iqbal",
            years: 65,
            gender: "male",
            ph_no: "8899001122",
            abo_group: "A+",
            presenting_complaints: ["Coronary Artery Disease", "COPD"],
            prescription: ["Aspirin 75mg", "Atorvastatin 20mg", "Salbutamol inhaler"],
            allergens: ["Sulfa drugs"],
            vitals: {
                systolic_diastolic: "162/98",
                bpm: 95,
                body_weight: 75,
                body_height: 172,
                spo2: 91,
                blood_glucose: 145,
            },
            date_of_admission: "2025-01-05",
            date_of_discharge: "2025-01-12",
        },
        {
            uhid: "CMC-102",
            name: "Priya Sharma",
            years: 28,
            gender: "female",
            ph_no: "7700112233",
            presenting_complaints: ["Migraine"],
            prescription: ["Sumatriptan 50mg"],
            vitals: {
                bpm: 68,
                body_weight: 55,
                body_height: 163,
                spo2: 99,
            },
        },
    ],
};

const run = async () => {
    try {
        console.log("🌱 Seeding hospital data...\n");

        const r1 = await axios.post(`${BASE_URL}/ingest`, hospitalA);
        console.log("Hospital A:", r1.data.message);

        const r2 = await axios.post(`${BASE_URL}/ingest`, hospitalB);
        console.log("Hospital B:", r2.data.message);

        console.log("\n⚙️  Processing all patients (generating insights + links)...");
        const r3 = await axios.post(`${BASE_URL}/ingest/process`);
        console.log("Results:", JSON.stringify(r3.data.results, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Seed failed:");
        console.error("Status  :", err.response?.status);
        console.error("Message :", err.response?.data || err.message);
        console.error("Stack   :", err.stack);
        process.exit(1);
    }
};

run();