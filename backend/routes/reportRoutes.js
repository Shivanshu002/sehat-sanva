const express = require("express");
const router = express.Router();
const { requestOTP, verifyOTPAndGetReport } = require("../controllers/reportController");

/**
 * @swagger
 * /api/report/request-otp:
 *   post:
 *     summary: Request OTP for patient report access
 *     tags: [Report]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OTP sent successfully" }
 *                 hint: { type: string, example: "OTP sent to phone ending in 3210" }
 *       404:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       410:
 *         description: Token expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/request-otp", requestOTP);

/**
 * @swagger
 * /api/report/verify:
 *   post:
 *     summary: Verify OTP and get full patient insight report
 *     tags: [Report]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerify'
 *     responses:
 *       200:
 *         description: Report fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Report fetched successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     patient:
 *                       $ref: '#/components/schemas/Patient'
 *                     insight:
 *                       $ref: '#/components/schemas/PatientInsight'
 *       400:
 *         description: Missing token or OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Patient or insight not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify", verifyOTPAndGetReport);

module.exports = router;