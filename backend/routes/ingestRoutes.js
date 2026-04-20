const express = require("express");
const router = express.Router();
const { ingestPatients, processPatients } = require("../controllers/ingestController");

/**
 * @swagger
 * /api/ingest:
 *   post:
 *     summary: Ingest raw patient data from any hospital format
 *     tags: [Ingest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IngestRequest'
 *     responses:
 *       200:
 *         description: Patients ingested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Ingested 2 patients successfully" }
 *                 saved: { type: array, items: { type: object } }
 *                 skipped: { type: array, items: { type: object } }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", ingestPatients);

/**
 * @swagger
 * /api/ingest/process:
 *   post:
 *     summary: Process all unprocessed patients — generate AI insights + access tokens
 *     tags: [Ingest]
 *     responses:
 *       200:
 *         description: Patients processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Processed 4/4 patients" }
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       patientId: { type: string }
 *                       name: { type: string }
 *                       insightGenerated: { type: boolean }
 *                       accessTokenCreated: { type: boolean }
 *                       riskLevel: { type: string }
 *                       riskScore: { type: number }
 *                       accessLink: { type: string }
 */
router.post("/process", processPatients);

module.exports = router;