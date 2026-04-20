"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/ReportContext";

export default function VerifyPage() {
  const router = useRouter();
  const { verifyOTP, loading, error, clearError, hint, otpSent } = useReport();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  // Redirect if user lands here directly without OTP
  useEffect(() => {
    if (!otpSent) {
      router.replace("/invalid");
    }
  }, [otpSent, router]);

  // Auto focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only numbers
    clearError();

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only 1 digit
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move back on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    // Focus last filled input
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;
    clearError();
    try {
      await verifyOTP(otpString);
      router.push("/report/view");
    } catch (err) {
      // error already set in context
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Enter OTP</h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Enter the 6-digit OTP sent to your registered contact.
          </p>
          {hint && (
            <p className="text-blue-400 text-xs mt-2 text-center bg-blue-900/20 px-4 py-2 rounded-lg">
              📩 {hint}
            </p>
          )}
        </div>

        {/* OTP Inputs */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-800 text-white outline-none transition-all duration-200
                ${digit ? "border-blue-500 bg-gray-700" : "border-gray-700"}
                ${error ? "border-red-500" : ""}
                focus:border-blue-400`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || !isComplete}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              ✅ Verify OTP
            </>
          )}
        </button>

        {/* OTP Expiry Note */}
        <p className="text-gray-600 text-xs text-center mt-4">
          OTP expires in 10 minutes. Do not share it with anyone.
        </p>

        {/* Footer */}
        <p className="text-gray-600 text-xs text-center mt-4">
          Powered by APIE — Autonomous Patient Insight Engine
        </p>

      </div>
    </div>
  );
}