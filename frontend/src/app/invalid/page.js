"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReport } from "@/context/ReportContext";

export default function InvalidPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestOTP, loading, error, clearError } = useReport();
  const [token, setToken] = useState(null);
  const [phone, setPhone] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const storedToken = sessionStorage.getItem("apie_token");
    const activeToken = urlToken || storedToken;

    if (activeToken) {
      setToken(activeToken);
    }
    setChecked(true);
  }, [searchParams]);

  const handleRequestOTP = async () => {
    if (!token || !phone || phone.length < 10) return;
    clearError();
    try {
      await requestOTP(token, phone);
      router.push("/report/verify");
    } catch (err) {
      // error shown in UI
    }
  };

  if (!checked) return null;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Invalid or Expired Link
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This health report link is either invalid, expired, or has already been used.
            Each link can only be accessed once.
          </p>
          <div className="bg-gray-800 rounded-xl p-4 mb-8 text-left space-y-2">
            <p className="text-gray-400 text-xs flex items-start gap-2">
              <span>⏱️</span> Links expire after <span className="text-white font-semibold">7 days</span>
            </p>
            <p className="text-gray-400 text-xs flex items-start gap-2">
              <span>🔒</span> Each link is <span className="text-white font-semibold">single-use only</span>
            </p>
            <p className="text-gray-400 text-xs flex items-start gap-2">
              <span>🏥</span> Contact your hospital for a <span className="text-white font-semibold">new report link</span>
            </p>
          </div>
          <p className="text-gray-600 text-xs">
            Powered by APIE — Autonomous Patient Insight Engine
          </p>
        </div>
      </div>
    );
  }

  // Token found — show OTP phone input form
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Health Report Access</h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Session expired. Enter your phone number to receive a new OTP.
          </p>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-xs text-center">
            ⚠️ This link is accessible only once. Please download your report after viewing.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">📱 Phone Number</label>
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
            <p className="text-red-400 text-xs mt-2">Please enter a valid 10-digit phone number</p>
          )}
        </div>

        <button
          onClick={handleRequestOTP}
          disabled={loading || phone.length < 10}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>📱 Send OTP</>
          )}
        </button>

        <p className="text-gray-600 text-xs text-center mt-6">
          Powered by APIE — Autonomous Patient Insight Engine
        </p>
      </div>
    </div>
  );
}
