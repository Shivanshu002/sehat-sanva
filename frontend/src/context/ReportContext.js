"use client";

import { createContext, useContext, useState } from "react";
import { doPost } from "@/services";
import { API_ROUTES } from "@/utils/routes";

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);

  // ── Request OTP ─────────────────────────────
  const requestOTP = async (tokenValue, phone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await doPost(API_ROUTES.REPORT.REQUEST_OTP, {
        token: tokenValue,
        phone,
      });
      setToken(tokenValue);
      setOtpSent(true);
      setHint(res.hint || null);
      return res;
    } catch (err) {
      setError(err.error || "Failed to send OTP. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP & Get Report ──────────────────
  const verifyOTP = async (otp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await doPost(API_ROUTES.REPORT.VERIFY_OTP, {
        token,
        otp,
      });
      setReportData(res.data);
      return res;
    } catch (err) {
      setError(err.error || "Invalid OTP. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ────────────────────────────────────
  const reset = () => {
    setToken(null);
    setOtpSent(false);
    setReportData(null);
    setError(null);
    setHint(null);
  };

  const clearError = () => setError(null);

  return (
    <ReportContext.Provider
      value={{
        token,
        otpSent,
        reportData,
        loading,
        error,
        hint,
        requestOTP,
        verifyOTP,
        reset,
        clearError,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) throw new Error("useReport must be used within ReportProvider");
  return context;
};