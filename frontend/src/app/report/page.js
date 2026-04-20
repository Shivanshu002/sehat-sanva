"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReport } from "@/context/ReportContext";

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestOTP, loading, error, clearError } = useReport();
  const [token, setToken] = useState(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      router.replace("/invalid");
    } else {
      setToken(t);
    }
  }, [searchParams, router]);

  const handleRequestOTP = async () => {
    if (!token || !phone) return;
    if (phone.length < 10) return;
    clearError();
    try {
      await requestOTP(token, phone);
      router.push("/report/verify");
    } catch (err) {
      // error already set in context
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Health Report Access</h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Enter your registered phone number to receive an OTP.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-xs text-center">
            ⚠️ This link is accessible only once. Please download your report after viewing.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Phone Input */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">
            📱 Phone Number
          </label>
          <div className="flex gap-2">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 flex items-center">
              <span className="text-gray-400 text-sm">+91</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                clearError();
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(val);
              }}
              placeholder="Enter 10-digit number"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-all placeholder-gray-600"
            />
          </div>
          {phone.length > 0 && phone.length < 10 && (
            <p className="text-red-400 text-xs mt-2">
              Please enter a valid 10-digit phone number
            </p>
          )}
        </div>

        {/* Token Preview */}
        {token && (
          <div className="bg-gray-800 rounded-xl p-3 mb-6">
            <p className="text-gray-500 text-xs mb-1">Access Token</p>
            <p className="text-gray-300 text-xs font-mono truncate">{token}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleRequestOTP}
          disabled={loading || !token || phone.length < 10}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              📱 Send OTP
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-gray-600 text-xs text-center mt-6">
          Powered by APIE — Autonomous Patient Insight Engine
        </p>

      </div>
    </div>
  );
}